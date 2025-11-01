import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Vibration,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAudioPlayer } from 'expo-audio';
import { ALARM_CHIME_DATA_URI } from '@/assets/audio/alarmChime';
import { useAppTheme } from '@/context/ThemeContext';

const MUSIC_OPTIONS = [
  {
    id: 'white-hush',
    name: 'White Hush',
    emoji: '🤍',
    description: 'A gentle static wash that brightens focus and energy.',
    family: 'white' as const,
  },
  {
    id: 'white-waves',
    name: 'White Waves',
    emoji: '🌊',
    description: 'Rolling broadband surf that keeps momentum moving.',
    family: 'white' as const,
  },
  {
    id: 'white-sparks',
    name: 'White Sparks',
    emoji: '✨',
    description: 'Shimmering tones that make the garden feel electric.',
    family: 'white' as const,
  },
  {
    id: 'grey-mist',
    name: 'Grey Mist',
    emoji: '🌫️',
    description: 'Balanced whispers of sound for calm concentration.',
    family: 'grey' as const,
  },
  {
    id: 'grey-embers',
    name: 'Grey Embers',
    emoji: '🔥',
    description: 'Warm crackles mixed with low hush for cozy evenings.',
    family: 'grey' as const,
  },
  {
    id: 'grey-lanterns',
    name: 'Grey Lanterns',
    emoji: '🏮',
    description: 'Soft drones and glowing chimes for twilight planting.',
    family: 'grey' as const,
  },
  {
    id: 'rain-mist',
    name: 'Rain Mist',
    emoji: '🌧️',
    description: 'Soft droplets on greenhouse glass for steady calm.',
    family: 'rain' as const,
  },
  {
    id: 'rain-thunder',
    name: 'Thunder Bloom',
    emoji: '⛈️',
    description: 'A sleepy storm with distant thunder rumbles.',
    family: 'rain' as const,
  },
  {
    id: 'ocean-tide',
    name: 'Moonlit Tides',
    emoji: '🌙',
    description: 'Slow tides and shimmering foam beneath the moon.',
    family: 'ocean' as const,
  },
  {
    id: 'ocean-depths',
    name: 'Deep Currents',
    emoji: '🐚',
    description: 'Subtle whale calls and gentle buoys far offshore.',
    family: 'ocean' as const,
  },
  {
    id: 'forest-dawn',
    name: 'Forest Dawn',
    emoji: '🌲',
    description: 'Birdsong and dew-kissed leaves greeting the sun.',
    family: 'forest' as const,
  },
  {
    id: 'forest-twilight',
    name: 'Twilight Grove',
    emoji: '🦉',
    description: 'Crickets and rustling branches after dusk settles.',
    family: 'forest' as const,
  },
  {
    id: 'static-amber',
    name: 'Amber Static',
    emoji: '📻',
    description: 'Vintage static with warm, cozy undertones.',
    family: 'static' as const,
  },
  {
    id: 'static-stars',
    name: 'Star Scanner',
    emoji: '🛰️',
    description: 'Spacey sweeps and distant signals for deep focus.',
    family: 'static' as const,
  },
  {
    id: 'keys-glass',
    name: 'Glass Keys',
    emoji: '🎹',
    description: 'Soft piano loops glimmering in the breeze.',
    family: 'keys' as const,
  },
  {
    id: 'keys-nocturne',
    name: 'Nocturne Notes',
    emoji: '🎼',
    description: 'Dusty chords and sleepy vinyl crackle.',
    family: 'keys' as const,
  },
  {
    id: 'night-orbit',
    name: 'Night Orbit',
    emoji: '🌌',
    description: 'Ambient synth pads that cradle the stars.',
    family: 'night' as const,
  },
  {
    id: 'night-halo',
    name: 'Lunar Halo',
    emoji: '🛌',
    description: 'Celestial hum that eases you into deep rest.',
    family: 'night' as const,
  },
] as const;

const MUSIC_GROUPS = [
  { id: 'forest', label: 'Forest Echoes', intro: 'Leaves, birds, and twilight breezes between the vines.' },
  { id: 'static', label: 'Static & Signal', intro: 'Analog textures tuned for deep concentration.' },
  { id: 'keys', label: 'Keys & Chords', intro: 'Piano and plucked harmonies to soften the mood.' },
  { id: 'ocean', label: 'Ocean Waves', intro: 'Coastal hush and tidal sways for breezy focus.' },
  { id: 'white', label: 'White Noise', intro: 'Bright, energetic mixes to keep the garden lively.' },
  { id: 'grey', label: 'Grey Noise', intro: 'Softly balanced sounds that settle the senses.' },
  { id: 'rain', label: 'Rainfall Retreats', intro: 'Falling drops and distant thunder for gentle nights.' },
  { id: 'night', label: 'Night Sky', intro: 'Synth swells and starlit drones for restorative sleep.' },
] as const;

const MUSIC_SERVICES = [
  {
    id: 'apple',
    name: 'Apple Music',
    emoji: '🍎',
    description: 'Link once to pull favourites and saved stations into the lounge.',
  },
  {
    id: 'spotify',
    name: 'Spotify',
    emoji: '🟢',
    description: 'Sync your liked songs and blends for quick playback.',
  },
] as const;

type StreamingTrack = { id: string; title: string; artist: string };

const SERVICE_SAMPLE_TRACKS: Record<MusicServiceId, StreamingTrack[]> = {
  apple: [
    { id: 'apple-morning', title: 'Morning Dew', artist: 'The Orchard Ensemble' },
    { id: 'apple-halo', title: 'Halo in Bloom', artist: 'Sleepy Conservatory' },
    { id: 'apple-vines', title: 'Vines & Vinyl', artist: 'LoFi Flora' },
    { id: 'apple-pulse', title: 'Garden Pulse', artist: 'Estelle Rivers' },
  ],
  spotify: [
    { id: 'spotify-dawn', title: 'Dawn Awake', artist: 'Aurora Drifters' },
    { id: 'spotify-rain', title: 'Rain Lanterns', artist: 'Moss Harbour' },
    { id: 'spotify-solstice', title: 'Solstice Steps', artist: 'Atlas Grove' },
    { id: 'spotify-ember', title: 'Ember Glow', artist: 'Nightshade Notes' },
  ],
};

const SLEEP_MODE_OPTIONS = [
  { id: 'timer', label: 'Timer', description: 'Fade out and stop playback when the time ends.' },
  { id: 'alarm', label: 'Wake alarm', description: 'Play gentle chimes at your wake time.' },
] as const;

const SLEEP_TIMER_PRESETS = [
  { id: '15', label: '15 min', minutes: 15 },
  { id: '30', label: '30 min', minutes: 30 },
  { id: '45', label: '45 min', minutes: 45 },
  { id: '60', label: '60 min', minutes: 60 },
  { id: '90', label: '90 min', minutes: 90 },
  { id: '120', label: '120 min', minutes: 120 },
] as const;

const ALARM_HOUR_OPTIONS = Array.from({ length: 12 }, (_, index) => index + 1);
const ALARM_MINUTE_OPTIONS = Array.from({ length: 60 }, (_, index) => index);
const ALARM_PERIOD_OPTIONS: AlarmPeriod[] = ['AM', 'PM'];
const WHEEL_ITEM_HEIGHT = 46;
const WHEEL_VISIBLE_ROWS = 5;
const WHEEL_CONTAINER_HEIGHT = WHEEL_ITEM_HEIGHT * WHEEL_VISIBLE_ROWS;
const WHEEL_PADDING = (WHEEL_CONTAINER_HEIGHT - WHEEL_ITEM_HEIGHT) / 2;
const ALARM_SOUND_URI = ALARM_CHIME_DATA_URI;

type Palette = {
  background: string;
  headerBackBackground: string;
  headerBackBorder: string;
  headerBackText: string;
  headerTitle: string;
  headerSubtitle: string;
  actionButtonBackground: string;
  actionButtonBorder: string;
  actionButtonShadow: string;
  actionBubbleBackground: string;
  actionBubbleBorder: string;
  actionIcon: string;
  cardBackground: string;
  cardBorder: string;
  cardShadow: string;
  nowPlayingLabel: string;
  nowPlayingMeta: string;
  nowPlayingTitle: string;
  nowPlayingSubtitle: string;
  nowPlayingEmojiBackground: string;
  sleepStatusBackground: string;
  sleepStatusBorder: string;
  sleepStatusLabel: string;
  sleepStatusHeadline: string;
  sleepStatusWarning: string;
  serviceCardBackground: string;
  serviceCardBorder: string;
  serviceCardConnectedBackground: string;
  serviceIconBackground: string;
  serviceIconConnectedBackground: string;
  serviceName: string;
  serviceNameConnected: string;
  serviceDescription: string;
  serviceStatus: string;
  serviceStatusConnected: string;
  groupToggleBackground: string;
  groupToggleBorder: string;
  groupToggleText: string;
  groupTitle: string;
  groupDescription: string;
  optionRowBackground: string;
  optionRowBorder: string;
  optionRowShadow: string;
  optionRowActiveBorder: string;
  optionRowActiveShadow: string;
  optionEmojiBackground: string;
  optionEmojiBackgroundActive: string;
  optionName: string;
  optionNameActive: string;
  optionDescription: string;
  optionBadge: string;
  overlay: string;
  modalBackground: string;
  modalHandle: string;
  modalTitle: string;
  modalDescription: string;
  sleepModeBackground: string;
  sleepModeBorder: string;
  sleepModeBackgroundActive: string;
  sleepModeBorderActive: string;
  sleepModeLabel: string;
  sleepModeLabelActive: string;
  sleepModeDescription: string;
  sleepSectionLabel: string;
  sleepTimerBackground: string;
  sleepTimerBorder: string;
  sleepTimerBackgroundActive: string;
  sleepTimerBorderActive: string;
  sleepTimerText: string;
  sleepTimerTextActive: string;
  alarmSeparator: string;
  sleepActiveHeadline: string;
  sleepActiveDetail: string;
  sleepClearBorder: string;
  sleepClearText: string;
  sleepApplyBackground: string;
  sleepApplyText: string;
  sleepApplyShadow: string;
  wheelBackground: string;
  wheelBorder: string;
  wheelHighlightBorder: string;
  wheelHighlightBackground: string;
  wheelText: string;
  wheelTextActive: string;
  sleepGlyphColor: string;
};

const DARK_PALETTE: Palette = {
  background: '#04120c',
  headerBackBackground: 'rgba(77, 255, 166, 0.12)',
  headerBackBorder: 'rgba(77, 255, 166, 0.35)',
  headerBackText: '#86f3c1',
  headerTitle: '#f6fff6',
  headerSubtitle: '#9edfb6',
  actionButtonBackground: 'rgba(18, 61, 39, 0.85)',
  actionButtonBorder: 'rgba(77, 255, 166, 0.32)',
  actionButtonShadow: '#03140d',
  actionBubbleBackground: 'rgba(77, 255, 166, 0.18)',
  actionBubbleBorder: 'rgba(77, 255, 166, 0.45)',
  actionIcon: '#f6fff6',
  cardBackground: 'rgba(10, 34, 24, 0.92)',
  cardBorder: 'rgba(77, 255, 166, 0.25)',
  cardShadow: '#021008',
  nowPlayingLabel: '#74f0ba',
  nowPlayingMeta: '#caffd6',
  nowPlayingTitle: '#f6fff6',
  nowPlayingSubtitle: '#9cbda9',
  nowPlayingEmojiBackground: 'rgba(77, 255, 166, 0.22)',
  sleepStatusBackground: 'rgba(8, 30, 21, 0.85)',
  sleepStatusBorder: 'rgba(77, 255, 166, 0.18)',
  sleepStatusLabel: '#6ee7b7',
  sleepStatusHeadline: '#e7fff2',
  sleepStatusWarning: '#fcd34d',
  serviceCardBackground: 'rgba(8, 26, 18, 0.9)',
  serviceCardBorder: 'rgba(77, 255, 166, 0.14)',
  serviceCardConnectedBackground: 'rgba(18, 61, 39, 0.92)',
  serviceIconBackground: 'rgba(77, 255, 166, 0.18)',
  serviceIconConnectedBackground: '#2dd78f',
  serviceName: '#f6fff6',
  serviceNameConnected: '#86f3c1',
  serviceDescription: '#8fb59f',
  serviceStatus: '#82cfa6',
  serviceStatusConnected: '#46f09d',
  groupToggleBackground: 'rgba(8, 26, 18, 0.9)',
  groupToggleBorder: 'rgba(77, 255, 166, 0.28)',
  groupToggleText: '#6ee7b7',
  groupTitle: '#f7fff9',
  groupDescription: '#9cbda9',
  optionRowBackground: 'rgba(9, 26, 18, 0.92)',
  optionRowBorder: 'rgba(77, 255, 166, 0.18)',
  optionRowShadow: '#021007',
  optionRowActiveBorder: '#2dd78f',
  optionRowActiveShadow: '#2dd78f',
  optionEmojiBackground: 'rgba(77, 255, 166, 0.16)',
  optionEmojiBackgroundActive: 'rgba(77, 255, 166, 0.28)',
  optionName: '#f6fff6',
  optionNameActive: '#86f3c1',
  optionDescription: '#97b2a4',
  optionBadge: '#6ee7b7',
  overlay: 'rgba(4, 12, 8, 0.82)',
  modalBackground: 'rgba(3, 16, 10, 0.98)',
  modalHandle: 'rgba(77, 255, 166, 0.28)',
  modalTitle: '#f6fff6',
  modalDescription: '#8fb59f',
  sleepModeBackground: 'rgba(7, 24, 16, 0.9)',
  sleepModeBorder: 'rgba(77, 255, 166, 0.14)',
  sleepModeBackgroundActive: 'rgba(18, 60, 39, 0.95)',
  sleepModeBorderActive: '#2dd78f',
  sleepModeLabel: '#8fb59f',
  sleepModeLabelActive: '#f6fff6',
  sleepModeDescription: '#6f8d7c',
  sleepSectionLabel: '#6ee7b7',
  sleepTimerBackground: 'rgba(7, 24, 16, 0.9)',
  sleepTimerBorder: 'rgba(77, 255, 166, 0.18)',
  sleepTimerBackgroundActive: 'rgba(18, 60, 39, 0.95)',
  sleepTimerBorderActive: '#2dd78f',
  sleepTimerText: '#caffd6',
  sleepTimerTextActive: '#062014',
  alarmSeparator: '#6ee7b7',
  sleepActiveHeadline: '#caffd6',
  sleepActiveDetail: '#8fb59f',
  sleepClearBorder: 'rgba(77, 255, 166, 0.28)',
  sleepClearText: '#86f3c1',
  sleepApplyBackground: '#2dd78f',
  sleepApplyText: '#04120c',
  sleepApplyShadow: '#2dd78f',
  wheelBackground: 'rgba(7, 24, 16, 0.9)',
  wheelBorder: 'rgba(77, 255, 166, 0.18)',
  wheelHighlightBorder: 'rgba(77, 255, 166, 0.35)',
  wheelHighlightBackground: 'rgba(18, 60, 39, 0.35)',
  wheelText: '#6f8d7c',
  wheelTextActive: '#f6fff6',
  sleepGlyphColor: '#f6fff6',
};

const LIGHT_PALETTE: Palette = {
  background: '#f6fbf7',
  headerBackBackground: '#e1f3e7',
  headerBackBorder: '#bfe5d3',
  headerBackText: '#1f7a53',
  headerTitle: '#0f3d2b',
  headerSubtitle: '#527c66',
  actionButtonBackground: '#ffffff',
  actionButtonBorder: '#caead9',
  actionButtonShadow: 'rgba(20, 70, 45, 0.12)',
  actionBubbleBackground: '#f0f8f3',
  actionBubbleBorder: '#cde8da',
  actionIcon: '#1f7a53',
  cardBackground: '#ffffff',
  cardBorder: '#cce8d7',
  cardShadow: 'rgba(20, 70, 45, 0.12)',
  nowPlayingLabel: '#208d62',
  nowPlayingMeta: '#3c7156',
  nowPlayingTitle: '#11402c',
  nowPlayingSubtitle: '#567d68',
  nowPlayingEmojiBackground: '#e3f4ea',
  sleepStatusBackground: '#f0f9f3',
  sleepStatusBorder: '#caead9',
  sleepStatusLabel: '#1f7a53',
  sleepStatusHeadline: '#11402c',
  sleepStatusWarning: '#c47f0e',
  serviceCardBackground: '#ffffff',
  serviceCardBorder: '#d9efe2',
  serviceCardConnectedBackground: '#e6f7ed',
  serviceIconBackground: '#e1f3e7',
  serviceIconConnectedBackground: '#2dd78f',
  serviceName: '#11402c',
  serviceNameConnected: '#1f7a53',
  serviceDescription: '#567d68',
  serviceStatus: '#3c7156',
  serviceStatusConnected: '#1c9d69',
  groupToggleBackground: '#eef8f2',
  groupToggleBorder: '#c2e4d5',
  groupToggleText: '#1f7a53',
  groupTitle: '#11402c',
  groupDescription: '#567d68',
  optionRowBackground: '#ffffff',
  optionRowBorder: '#d5ecdf',
  optionRowShadow: 'rgba(20, 70, 45, 0.1)',
  optionRowActiveBorder: '#2dd78f',
  optionRowActiveShadow: 'rgba(45, 215, 143, 0.35)',
  optionEmojiBackground: '#e3f4ea',
  optionEmojiBackgroundActive: '#d2f0e0',
  optionName: '#11402c',
  optionNameActive: '#1f7a53',
  optionDescription: '#5f8570',
  optionBadge: '#1f7a53',
  overlay: 'rgba(16, 32, 24, 0.35)',
  modalBackground: '#ffffff',
  modalHandle: '#ccead7',
  modalTitle: '#0f3d2b',
  modalDescription: '#527c66',
  sleepModeBackground: '#f3faf5',
  sleepModeBorder: '#d1eadd',
  sleepModeBackgroundActive: '#e3f6ec',
  sleepModeBorderActive: '#2dd78f',
  sleepModeLabel: '#3d7156',
  sleepModeLabelActive: '#0f3d2b',
  sleepModeDescription: '#6a8d7a',
  sleepSectionLabel: '#1f7a53',
  sleepTimerBackground: '#f3faf5',
  sleepTimerBorder: '#d1eadd',
  sleepTimerBackgroundActive: '#e0f5eb',
  sleepTimerBorderActive: '#2dd78f',
  sleepTimerText: '#205c42',
  sleepTimerTextActive: '#073621',
  alarmSeparator: '#1f7a53',
  sleepActiveHeadline: '#1f7a53',
  sleepActiveDetail: '#527c66',
  sleepClearBorder: '#bfe5d3',
  sleepClearText: '#1f7a53',
  sleepApplyBackground: '#2dd78f',
  sleepApplyText: '#073621',
  sleepApplyShadow: 'rgba(45, 215, 143, 0.35)',
  wheelBackground: '#f3faf5',
  wheelBorder: '#d1eadd',
  wheelHighlightBorder: '#a5d8be',
  wheelHighlightBackground: '#e1f3e7',
  wheelText: '#6a8d7a',
  wheelTextActive: '#0f3d2b',
  sleepGlyphColor: '#1f7a53',
};

const createStyles = (palette: Palette, isDark: boolean) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: palette.background,
    },
    scroll: {
      flex: 1,
      backgroundColor: palette.background,
    },
    content: {
      paddingHorizontal: 24,
      paddingBottom: 48,
      gap: 28,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
    },
    headerBackButton: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 999,
      backgroundColor: palette.headerBackBackground,
      borderWidth: 1,
      borderColor: palette.headerBackBorder,
    },
    headerBackText: {
      fontSize: 13,
      fontWeight: '700',
      color: palette.headerBackText,
      letterSpacing: 0.4,
      textTransform: 'uppercase',
    },
    headerCenter: {
      flex: 1,
      alignItems: 'center',
      gap: 4,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: '800',
      color: palette.headerTitle,
      textAlign: 'center',
    },
    headerSubtitle: {
      fontSize: 14,
      lineHeight: 20,
      color: palette.headerSubtitle,
      textAlign: 'center',
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flexShrink: 0,
    },
    headerActionButton: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 12,
      paddingVertical: 12,
      borderRadius: 999,
      backgroundColor: palette.actionButtonBackground,
      borderWidth: 1,
      borderColor: palette.actionButtonBorder,
      shadowColor: palette.actionButtonShadow,
      shadowOpacity: isDark ? 0.35 : 0.16,
      shadowRadius: isDark ? 16 : 10,
      shadowOffset: { width: 0, height: isDark ? 8 : 5 },
      elevation: isDark ? 6 : 3,
    },
    headerActionBubble: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: palette.actionBubbleBackground,
      borderWidth: 1,
      borderColor: palette.actionBubbleBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerActionGlyph: {
      fontSize: 24,
      color: palette.sleepGlyphColor,
    },
    nowPlayingCard: {
      backgroundColor: palette.cardBackground,
      borderRadius: 28,
      padding: 24,
      gap: 18,
      borderWidth: 1,
      borderColor: palette.cardBorder,
      shadowColor: palette.cardShadow,
      shadowOpacity: isDark ? 0.45 : 0.18,
      shadowRadius: isDark ? 26 : 18,
      shadowOffset: { width: 0, height: isDark ? 18 : 12 },
      elevation: isDark ? 8 : 4,
    },
    nowPlayingHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    nowPlayingLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: palette.nowPlayingLabel,
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
    nowPlayingMeta: {
      fontSize: 12,
      fontWeight: '600',
      color: palette.nowPlayingMeta,
    },
    nowPlayingRow: {
      flexDirection: 'column',
      alignItems: 'center',
      gap: 18,
    },
    nowPlayingEmojiWrap: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: palette.nowPlayingEmojiBackground,
      alignItems: 'center',
      justifyContent: 'center',
    },
    nowPlayingEmoji: {
      fontSize: 34,
    },
    nowPlayingBody: {
      flex: 1,
      gap: 6,
      alignItems: 'center',
    },
    nowPlayingTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: palette.nowPlayingTitle,
      textAlign: 'center',
    },
    nowPlayingSubtitle: {
      fontSize: 13,
      lineHeight: 18,
      color: palette.nowPlayingSubtitle,
      textAlign: 'center',
    },
    sleepStatusBlock: {
      gap: 4,
      padding: 14,
      borderRadius: 18,
      backgroundColor: palette.sleepStatusBackground,
      borderWidth: 1,
      borderColor: palette.sleepStatusBorder,
    },
    sleepStatusLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: palette.sleepStatusLabel,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
    sleepStatusHeadline: {
      fontSize: 14,
      fontWeight: '600',
      color: palette.sleepStatusHeadline,
    },
    sleepStatusWarning: {
      fontSize: 12,
      color: palette.sleepStatusWarning,
    },
    serviceSection: {
      gap: 12,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: palette.groupTitle,
    },
    sectionSubtitle: {
      fontSize: 13,
      color: palette.groupDescription,
      lineHeight: 19,
    },
    serviceList: {
      gap: 12,
    },
    serviceCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      backgroundColor: palette.serviceCardBackground,
      borderRadius: 20,
      padding: 18,
      borderWidth: 1,
      borderColor: palette.serviceCardBorder,
    },
    serviceCardConnected: {
      backgroundColor: palette.serviceCardConnectedBackground,
      borderColor: palette.serviceCardBorder,
    },
    serviceIconWrap: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: palette.serviceIconBackground,
      alignItems: 'center',
      justifyContent: 'center',
    },
    serviceIconWrapConnected: {
      backgroundColor: palette.serviceIconConnectedBackground,
    },
    serviceIcon: {
      fontSize: 26,
    },
    serviceBody: {
      flex: 1,
      gap: 4,
    },
    serviceName: {
      fontSize: 16,
      fontWeight: '700',
      color: palette.serviceName,
    },
    serviceNameConnected: {
      color: palette.serviceNameConnected,
    },
    serviceDescription: {
      fontSize: 12,
      lineHeight: 17,
      color: palette.serviceDescription,
    },
    serviceStatus: {
      fontSize: 12,
      fontWeight: '600',
      color: palette.serviceStatus,
    },
    serviceStatusConnected: {
      color: palette.serviceStatusConnected,
    },
    streamingSection: {
      gap: 12,
      backgroundColor: palette.cardBackground,
      borderRadius: 28,
      padding: 22,
      borderWidth: 1,
      borderColor: palette.cardBorder,
      shadowColor: palette.cardShadow,
      shadowOpacity: isDark ? 0.4 : 0.2,
      shadowRadius: isDark ? 24 : 16,
      shadowOffset: { width: 0, height: isDark ? 14 : 10 },
      elevation: isDark ? 7 : 4,
    },
    streamingHeading: {
      fontSize: 17,
      fontWeight: '700',
      color: palette.groupTitle,
    },
    streamingSubheading: {
      fontSize: 13,
      lineHeight: 18,
      color: palette.groupDescription,
    },
    streamingSearchInput: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: palette.sleepTimerBorder,
      backgroundColor: palette.sleepTimerBackground,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 15,
      color: palette.groupTitle,
    },
    streamingList: {
      gap: 10,
    },
    streamingItem: {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: palette.serviceCardBorder,
      backgroundColor: palette.serviceCardBackground,
      paddingHorizontal: 18,
      paddingVertical: 14,
      gap: 4,
    },
    streamingItemMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    streamingItemTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: palette.optionName,
    },
    streamingItemArtist: {
      fontSize: 13,
      color: palette.optionDescription,
    },
    streamingEmpty: {
      fontSize: 12,
      color: palette.groupDescription,
    },
    streamingBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor: palette.optionEmojiBackground,
    },
    streamingBadgeText: {
      fontSize: 11,
      fontWeight: '700',
      color: palette.optionNameActive,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
    },
    groupSection: {
      gap: 14,
    },
    groupToggle: {
      alignSelf: 'flex-start',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: palette.groupToggleBackground,
      borderWidth: 1,
      borderColor: palette.groupToggleBorder,
    },
    groupToggleText: {
      fontSize: 12,
      fontWeight: '700',
      color: palette.groupToggleText,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
    secondaryGroup: {
      gap: 14,
    },
    groupTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: palette.groupTitle,
    },
    groupDescription: {
      fontSize: 13,
      color: palette.groupDescription,
    },
    optionList: {
      gap: 12,
    },
    optionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      backgroundColor: palette.optionRowBackground,
      borderRadius: 20,
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderWidth: 1,
      borderColor: palette.optionRowBorder,
      shadowColor: palette.optionRowShadow,
      shadowOpacity: isDark ? 0.35 : 0.16,
      shadowRadius: isDark ? 12 : 8,
      shadowOffset: { width: 0, height: isDark ? 8 : 5 },
      elevation: isDark ? 3 : 1,
    },
    optionRowActive: {
      borderColor: palette.optionRowActiveBorder,
      shadowColor: palette.optionRowActiveShadow,
      shadowOpacity: isDark ? 0.45 : 0.26,
    },
    optionEmojiWrap: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: palette.optionEmojiBackground,
      alignItems: 'center',
      justifyContent: 'center',
    },
    optionEmojiWrapActive: {
      backgroundColor: palette.optionEmojiBackgroundActive,
    },
    optionEmoji: {
      fontSize: 28,
    },
    optionEmojiActive: {
      transform: [{ scale: 1.1 }],
    },
    optionBody: {
      flex: 1,
      gap: 4,
    },
    optionName: {
      fontSize: 16,
      fontWeight: '700',
      color: palette.optionName,
    },
    optionNameActive: {
      color: palette.optionNameActive,
    },
    optionDescription: {
      fontSize: 12,
      lineHeight: 17,
      color: palette.optionDescription,
    },
    optionBadge: {
      fontSize: 12,
      fontWeight: '700',
      color: palette.optionBadge,
    },
    sleepOverlay: {
      flex: 1,
      backgroundColor: palette.overlay,
      justifyContent: 'flex-end',
    },
    sleepBackdrop: {
      ...StyleSheet.absoluteFillObject,
    },
    sleepCard: {
      backgroundColor: palette.modalBackground,
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      paddingHorizontal: 24,
      paddingTop: 22,
      gap: 20,
    },
    sleepHandle: {
      alignSelf: 'center',
      width: 52,
      height: 5,
      borderRadius: 999,
      backgroundColor: palette.modalHandle,
    },
    sleepTitle: {
      fontSize: 22,
      fontWeight: '800',
      color: palette.modalTitle,
      textAlign: 'center',
    },
    sleepDescription: {
      fontSize: 13,
      color: palette.modalDescription,
      textAlign: 'center',
      lineHeight: 18,
    },
    sleepModeRow: {
      flexDirection: 'row',
      gap: 12,
    },
    sleepModeButton: {
      flex: 1,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: palette.sleepModeBorder,
      paddingVertical: 16,
      paddingHorizontal: 14,
      gap: 6,
      backgroundColor: palette.sleepModeBackground,
    },
    sleepModeButtonActive: {
      backgroundColor: palette.sleepModeBackgroundActive,
      borderColor: palette.sleepModeBorderActive,
    },
    sleepModeLabel: {
      fontSize: 14,
      fontWeight: '700',
      color: palette.sleepModeLabel,
    },
    sleepModeLabelActive: {
      color: palette.sleepModeLabelActive,
    },
    sleepModeDescription: {
      fontSize: 12,
      color: palette.sleepModeDescription,
      lineHeight: 16,
    },
    sleepSectionLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: palette.sleepSectionLabel,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
    sleepTimerGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    sleepTimerButton: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: palette.sleepTimerBorder,
      backgroundColor: palette.sleepTimerBackground,
    },
    sleepTimerButtonActive: {
      backgroundColor: palette.sleepTimerBackgroundActive,
      borderColor: palette.sleepTimerBorderActive,
    },
    sleepTimerText: {
      fontSize: 14,
      fontWeight: '600',
      color: palette.sleepTimerText,
    },
    sleepTimerTextActive: {
      color: palette.sleepTimerTextActive,
    },
    alarmPickerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      justifyContent: 'space-between',
    },
    alarmPickerSeparator: {
      fontSize: 24,
      fontWeight: '700',
      color: palette.alarmSeparator,
    },
    sleepActiveSummary: {
      gap: 4,
      alignItems: 'center',
    },
    sleepActiveHeadline: {
      fontSize: 14,
      fontWeight: '700',
      color: palette.sleepActiveHeadline,
    },
    sleepActiveDetail: {
      fontSize: 12,
      color: palette.sleepActiveDetail,
    },
    sleepActions: {
      flexDirection: 'row',
      gap: 14,
    },
    sleepClearButton: {
      flex: 1,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: palette.sleepClearBorder,
      alignItems: 'center',
      paddingVertical: 14,
    },
    sleepClearButtonText: {
      fontSize: 15,
      fontWeight: '700',
      color: palette.sleepClearText,
    },
    sleepApplyButton: {
      flex: 1,
      borderRadius: 16,
      backgroundColor: palette.sleepApplyBackground,
      alignItems: 'center',
      paddingVertical: 14,
      shadowColor: palette.sleepApplyShadow,
      shadowOpacity: isDark ? 0.4 : 0.25,
      shadowRadius: isDark ? 12 : 10,
      shadowOffset: { width: 0, height: isDark ? 8 : 6 },
      elevation: isDark ? 5 : 3,
    },
    sleepApplyButtonText: {
      fontSize: 15,
      fontWeight: '700',
      color: palette.sleepApplyText,
    },
    wheelPickerContainer: {
      height: WHEEL_CONTAINER_HEIGHT,
      width: 64,
      borderRadius: 18,
      backgroundColor: palette.wheelBackground,
      borderWidth: 1,
      borderColor: palette.wheelBorder,
      overflow: 'hidden',
    },
    wheelPickerHighlight: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: (WHEEL_CONTAINER_HEIGHT - WHEEL_ITEM_HEIGHT) / 2,
      height: WHEEL_ITEM_HEIGHT,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: palette.wheelHighlightBorder,
      backgroundColor: palette.wheelHighlightBackground,
    },
    wheelPickerScroll: {
      flex: 1,
    },
    wheelPickerContent: {
      paddingVertical: WHEEL_PADDING,
    },
    wheelPickerItem: {
      height: WHEEL_ITEM_HEIGHT,
      alignItems: 'center',
      justifyContent: 'center',
    },
    wheelPickerText: {
      fontSize: 18,
      fontWeight: '600',
      color: palette.wheelText,
    },
    wheelPickerTextActive: {
      color: palette.wheelTextActive,
    },
  });



const PRIORITIZED_GROUP_IDS = new Set(['forest', 'static', 'keys', 'ocean']);

const formatAlarmDisplay = (hour: number, minute: number, period: AlarmPeriod) =>
  `${hour}:${minute.toString().padStart(2, '0')} ${period}`;

const clampTimerMinutes = (minutes: number) => Math.max(1, Math.round(minutes));

const ceilingMinutesFromMs = (ms: number) => Math.max(1, Math.ceil(ms / 60000));

const formatDurationLong = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const parts: string[] = [];
  if (hours > 0) {
    parts.push(`${hours} ${hours === 1 ? 'hour' : 'hours'}`);
  }
  if (mins > 0) {
    parts.push(`${mins} ${mins === 1 ? 'minute' : 'minutes'}`);
  }
  if (parts.length === 0) {
    return '0 minutes';
  }
  return parts.join(' ');
};

const formatDurationCompact = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) {
    return `${mins}m`;
  }
  if (mins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${mins}m`;
};

type MusicOption = (typeof MUSIC_OPTIONS)[number];
type MusicServiceId = (typeof MUSIC_SERVICES)[number]['id'];
type MusicServiceProfile = { connected: boolean; favorites: StreamingTrack[] };
type StreamingSelection = { service: MusicServiceId; track: StreamingTrack };
type SleepMode = (typeof SLEEP_MODE_OPTIONS)[number]['id'];
type AlarmPeriod = 'AM' | 'PM';

type SleepCircleState =
  | { mode: 'timer'; duration: number; targetTimestamp: number }
  | { mode: 'alarm'; fireTimestamp: number; hour: number; minute: number; period: AlarmPeriod }
  | null;

type MusicContentProps = {
  mode?: 'screen' | 'modal';
  onRequestClose?: () => void;
  defaultSleepOpen?: boolean;
};

export function MusicContent({ mode = 'screen', onRequestClose, defaultSleepOpen = false }: MusicContentProps) {
  const insets = useSafeAreaInsets();
  const { colorScheme, toggleColorScheme } = useAppTheme();
  const palette = colorScheme === 'dark' ? DARK_PALETTE : LIGHT_PALETTE;
  const styles = useMemo(() => createStyles(palette, colorScheme === 'dark'), [colorScheme, palette]);
  const themeToggleHint = colorScheme === 'dark' ? 'Switch lounge to light mode' : 'Switch lounge to dark mode';
  const themeToggleIcon = '🌙';
  const [selectedTrackId, setSelectedTrackId] = useState<MusicOption['id']>(MUSIC_OPTIONS[0].id);
  const [serviceProfiles, setServiceProfiles] = useState<Record<MusicServiceId, MusicServiceProfile>>({
    apple: { connected: false, favorites: [] },
    spotify: { connected: false, favorites: [] },
  });
  const [activeFavorite, setActiveFavorite] = useState<StreamingSelection | null>(null);
  const [streamSearchQuery, setStreamSearchQuery] = useState('');
  const [sleepModalOpen, setSleepModalOpen] = useState(defaultSleepOpen);
  const streamingPlaceholderColor = palette.sleepTimerText;
  const [sleepMode, setSleepMode] = useState<SleepMode>('timer');
  const [sleepTimerMinutes, setSleepTimerMinutes] = useState<number>(30);
  const [alarmHour, setAlarmHour] = useState<number>(7);
  const [alarmMinute, setAlarmMinute] = useState<number>(0);
  const [alarmPeriod, setAlarmPeriod] = useState<AlarmPeriod>('AM');
  const [sleepCircle, setSleepCircle] = useState<SleepCircleState>(null);
  const [sleepNow, setSleepNow] = useState(() => Date.now());
  const sleepTimeoutRef = useRef<number | null>(null);
  const alarmPlayer = useAudioPlayer(ALARM_SOUND_URI);
  const [audioReady, setAudioReady] = useState(false);
  const [audioError, setAudioError] = useState<Error | null>(null);
  const [showAllGroups, setShowAllGroups] = useState(false);

  useEffect(() => {
    if (defaultSleepOpen) {
      setSleepModalOpen(true);
    }
  }, [defaultSleepOpen]);

  useEffect(() => {
    const interval = setInterval(() => {
      setSleepNow(Date.now());
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // expo-audio automatically handles audio setup, no manual initialization needed
    setAudioReady(true);

    return () => {
      if (sleepTimeoutRef.current) {
        clearTimeout(sleepTimeoutRef.current);
        sleepTimeoutRef.current = null;
      }
    };
  }, []);

  const groupedOptions = useMemo(
    () =>
      MUSIC_GROUPS.map((group) => ({
        ...group,
        options: MUSIC_OPTIONS.filter((option) => option.family === group.id),
      })),
    []
  );

  const primaryGroups = useMemo(
    () => groupedOptions.filter((group) => PRIORITIZED_GROUP_IDS.has(group.id) && group.options.length > 0),
    [groupedOptions]
  );

  const secondaryGroups = useMemo(
    () => groupedOptions.filter((group) => !PRIORITIZED_GROUP_IDS.has(group.id) && group.options.length > 0),
    [groupedOptions]
  );

  useEffect(() => {
    if (secondaryGroups.length === 0 && showAllGroups) {
      setShowAllGroups(false);
    }
  }, [secondaryGroups.length, showAllGroups]);

  const selectedTrack = useMemo(
    () => MUSIC_OPTIONS.find((option) => option.id === selectedTrackId) ?? MUSIC_OPTIONS[0],
    [selectedTrackId]
  );

  const nowPlayingDetails = useMemo(() => {
    if (activeFavorite) {
      const service = MUSIC_SERVICES.find((entry) => entry.id === activeFavorite.service);
      return {
        emoji: '🎧',
        title: activeFavorite.track.title,
        subtitle: `${activeFavorite.track.artist}${service ? ` · ${service.name}` : ''}`,
      };
    }

    return {
      emoji: selectedTrack.emoji,
      title: selectedTrack.name,
      subtitle: selectedTrack.description,
    };
  }, [activeFavorite, selectedTrack]);

  const serviceNameMap = useMemo(
    () =>
      MUSIC_SERVICES.reduce<Record<MusicServiceId, string>>((acc, service) => {
        acc[service.id] = service.name;
        return acc;
      }, {} as Record<MusicServiceId, string>),
    []
  );

  const connectedFavorites = useMemo(() => {
    const entries: StreamingSelection[] = [];
    (Object.keys(serviceProfiles) as MusicServiceId[]).forEach((serviceId) => {
      const profile = serviceProfiles[serviceId];
      if (!profile?.connected) {
        return;
      }

      profile.favorites.forEach((track) => {
        entries.push({ service: serviceId, track });
      });
    });
    return entries;
  }, [serviceProfiles]);

  const normalizedSearch = streamSearchQuery.trim().toLowerCase();
  const searchResults = useMemo(() => {
    if (!normalizedSearch) {
      return [] as StreamingSelection[];
    }

    return connectedFavorites.filter(({ track }) => {
      const title = track.title.toLowerCase();
      const artist = track.artist.toLowerCase();
      return title.includes(normalizedSearch) || artist.includes(normalizedSearch);
    });
  }, [connectedFavorites, normalizedSearch]);

  const hasSearch = normalizedSearch.length > 0;
  const displayedFavorites = useMemo(() => {
    if (hasSearch) {
      return searchResults;
    }
    return connectedFavorites.slice(0, 8);
  }, [connectedFavorites, hasSearch, searchResults]);

  const hasStreamingConnection = connectedFavorites.length > 0;
  const searchEmpty = hasSearch && searchResults.length === 0;

  const sleepSummary = useMemo(() => {
    if (!sleepCircle) {
      return {
        headline: 'Dream Capsule off',
        detail: 'Timer and alarm idle',
      };
    }

    if (sleepCircle.mode === 'timer') {
      const remainingMs = sleepCircle.targetTimestamp - sleepNow;

      if (remainingMs <= 0) {
        return {
          headline: 'Timer · ready',
          detail: 'Awaiting your next session',
        };
      }

      const minutes = ceilingMinutesFromMs(remainingMs);
      return {
        headline: `Timer · ${formatDurationCompact(minutes)}`,
        detail: `Stops in ${formatDurationLong(minutes)}`,
      };
    }

    const remainingMs = sleepCircle.fireTimestamp - sleepNow;
    const label = formatAlarmDisplay(sleepCircle.hour, sleepCircle.minute, sleepCircle.period);

    if (remainingMs <= 0) {
      return {
        headline: `Alarm · ${label}`,
        detail: 'Ringing momentarily',
      };
    }

    const minutes = ceilingMinutesFromMs(remainingMs);
    return {
      headline: `Alarm · ${label}`,
      detail: `Rings in ${formatDurationLong(minutes)}`,
    };
  }, [sleepCircle, sleepNow]);

  const handleSelectTrack = useCallback((trackId: MusicOption['id']) => {
    setSelectedTrackId(trackId);
    setActiveFavorite(null);
  }, []);

  const handleConnectService = useCallback((serviceId: MusicServiceId) => {
    setServiceProfiles((prev) => {
      const current = prev[serviceId];
      if (current?.connected) {
        return prev;
      }

      const favourites = SERVICE_SAMPLE_TRACKS[serviceId] ?? [];
      const nextProfile: MusicServiceProfile = { connected: true, favorites: favourites };
      return { ...prev, [serviceId]: nextProfile };
    });

    setActiveFavorite((existing) => {
      if (existing) {
        return existing;
      }
      const sample = SERVICE_SAMPLE_TRACKS[serviceId]?.[0];
      return sample ? { service: serviceId, track: sample } : null;
    });
  }, []);

  const handlePlayFavorite = useCallback((serviceId: MusicServiceId, track: StreamingTrack) => {
    setActiveFavorite({ service: serviceId, track });
  }, []);

  const handleSleepComplete = useCallback(
    async (mode: SleepMode) => {
      setSleepCircle(null);
      Vibration.vibrate([0, 400, 200, 400], false);

      try {
        if (mode === 'alarm') {
          alarmPlayer.seekTo(0);
          alarmPlayer.play();
        }
      } catch (error) {
        console.warn('Alarm playback failed', error);
      }

      Alert.alert(
        mode === 'timer' ? 'Timer finished' : 'Alarm ringing',
        mode === 'timer'
          ? 'Playback faded out with the Dream Capsule timer.'
          : 'Time to wake up! Your Dream Capsule alarm is sounding.'
      );
    },
    [alarmPlayer]
  );

  const scheduleSleepTrigger = useCallback(
    (state: SleepCircleState) => {
      if (sleepTimeoutRef.current) {
        clearTimeout(sleepTimeoutRef.current);
        sleepTimeoutRef.current = null;
      }

      if (!state) {
        return;
      }

      const target = state.mode === 'timer' ? state.targetTimestamp : state.fireTimestamp;
      const delay = Math.max(target - Date.now(), 0);

      sleepTimeoutRef.current = setTimeout(() => {
        handleSleepComplete(state.mode);
      }, delay);
    },
    [handleSleepComplete]
  );

  useEffect(() => {
    scheduleSleepTrigger(sleepCircle);
  }, [scheduleSleepTrigger, sleepCircle]);

  const handleOpenSleepModal = useCallback(() => {
    if (sleepCircle?.mode === 'timer') {
      const remainingMs = sleepCircle.targetTimestamp - Date.now();
      setSleepMode('timer');
      setSleepTimerMinutes(clampTimerMinutes(remainingMs > 0 ? remainingMs / 60000 : sleepCircle.duration));
    } else if (sleepCircle?.mode === 'alarm') {
      setSleepMode('alarm');
      setAlarmHour(sleepCircle.hour);
      setAlarmMinute(sleepCircle.minute);
      setAlarmPeriod(sleepCircle.period);
    }
    setSleepModalOpen(true);
  }, [sleepCircle]);

  const handleApplySleepCircle = useCallback(() => {
    if (sleepMode === 'timer') {
      const minutes = clampTimerMinutes(sleepTimerMinutes);
      const targetTimestamp = Date.now() + minutes * 60000;
      setSleepCircle({ mode: 'timer', duration: minutes, targetTimestamp });
    } else {
      const normalizedHour = alarmHour % 12 === 0 ? 12 : alarmHour % 12;
      const hour24 = (normalizedHour % 12) + (alarmPeriod === 'PM' ? 12 : 0);
      const now = new Date();
      const target = new Date(now);
      target.setSeconds(0, 0);
      target.setHours(hour24, alarmMinute, 0, 0);

      if (target.getTime() <= now.getTime()) {
        target.setDate(target.getDate() + 1);
      }

      setSleepCircle({
        mode: 'alarm',
        fireTimestamp: target.getTime(),
        hour: normalizedHour,
        minute: alarmMinute,
        period: alarmPeriod,
      });
    }
    setSleepModalOpen(false);
  }, [alarmHour, alarmMinute, alarmPeriod, sleepMode, sleepTimerMinutes]);

  const handleClearSleepCircle = useCallback(() => {
    setSleepCircle(null);
    setSleepModalOpen(false);
  }, []);

  const handleClose = useCallback(() => {
    if (onRequestClose) {
      onRequestClose();
    }
  }, [onRequestClose]);

  const headerBackText = mode === 'screen' ? '← Back' : 'Back';
  const headerBackAccessibility = mode === 'screen' ? 'Go back' : 'Close music lounge';

  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: insets.top + 12 }]} edges={['left', 'right']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator
        contentInsetAdjustmentBehavior="never"
      >
        <View style={styles.headerRow}>
          <Pressable
            onPress={handleClose}
            style={styles.headerBackButton}
            accessibilityRole="button"
            accessibilityLabel={headerBackAccessibility}
          >
            <Text style={styles.headerBackText}>{headerBackText}</Text>
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Music Lounge</Text>
            <Text style={styles.headerSubtitle}>Curated ambience for focus &amp; rest.</Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              onPress={toggleColorScheme}
              style={styles.headerActionButton}
              accessibilityRole="button"
              accessibilityLabel="Toggle lounge theme"
            accessibilityHint={themeToggleHint}
            accessibilityValue={{ text: colorScheme === 'dark' ? 'Dark mode active' : 'Light mode active' }}
          >
            <View style={styles.headerActionBubble}>
              <Text style={styles.headerActionGlyph}>{themeToggleIcon}</Text>
            </View>
          </Pressable>
            <Pressable
              onPress={handleOpenSleepModal}
              style={styles.headerActionButton}
              accessibilityRole="button"
              accessibilityLabel="Open Dream Capsule controls"
              accessibilityHint="Set timers or wake alarms"
              accessibilityValue={{ text: sleepSummary.headline }}
            >
              <View style={styles.headerActionBubble}>
                <Text style={styles.headerActionGlyph}>⏰</Text>
              </View>
            </Pressable>
          </View>
        </View>

        <View style={styles.nowPlayingCard}>
          <View style={styles.nowPlayingHeader}>
            <Text style={styles.nowPlayingLabel}>Now playing</Text>
            <Text style={styles.nowPlayingMeta}>{sleepSummary.headline}</Text>
          </View>
          <View style={styles.nowPlayingRow}>
            <View style={styles.nowPlayingEmojiWrap}>
              <Text style={styles.nowPlayingEmoji}>{nowPlayingDetails.emoji}</Text>
            </View>
            <View style={styles.nowPlayingBody}>
              <Text style={styles.nowPlayingTitle}>{nowPlayingDetails.title}</Text>
              <Text style={styles.nowPlayingSubtitle}>{nowPlayingDetails.subtitle}</Text>
            </View>
          </View>
          <View style={styles.sleepStatusBlock}>
            <Text style={styles.sleepStatusLabel}>Dream Capsule</Text>
            <Text style={styles.sleepStatusHeadline}>{sleepSummary.detail}</Text>
            {!audioReady && audioError ? (
              <Text style={styles.sleepStatusWarning}>
                Alarm chime installs with expo-av. Until then, we’ll vibrate instead.
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.serviceSection}>
          <Text style={styles.sectionTitle}>Connect your music</Text>
          <Text style={styles.sectionSubtitle}>
            Link Apple Music or Spotify to stream your own playlists inside the lounge.
          </Text>
          <View style={styles.serviceList}>
            {MUSIC_SERVICES.map((service) => {
              const profile = serviceProfiles[service.id];
              const connected = profile?.connected ?? false;
              const favouriteCount = profile?.favorites.length ?? 0;
              return (
                <Pressable
                  key={service.id}
                  style={[styles.serviceCard, connected && styles.serviceCardConnected]}
                  onPress={() => handleConnectService(service.id)}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: connected }}
                  accessibilityLabel={
                    connected
                      ? `${service.name} connected`
                      : `Connect ${service.name}`
                  }
                  accessibilityHint={
                    connected
                      ? `${favouriteCount} favourites ready in the lounge`
                      : 'Opens secure sign-in to import favourites'
                  }
                  disabled={connected}
                >
                  <View
                    style={[styles.serviceIconWrap, connected && styles.serviceIconWrapConnected]}
                    pointerEvents="none"
                  >
                    <Text style={styles.serviceIcon}>{service.emoji}</Text>
                  </View>
                  <View style={styles.serviceBody}>
                    <Text style={[styles.serviceName, connected && styles.serviceNameConnected]}>
                      {service.name}
                    </Text>
                    <Text style={styles.serviceDescription}>{service.description}</Text>
                    <Text style={[styles.serviceStatus, connected && styles.serviceStatusConnected]}>
                      {connected
                        ? `Connected · ${favouriteCount} favourite${favouriteCount === 1 ? '' : 's'}`
                        : 'Connect once to import favourites'}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.streamingSection}>
          <Text style={styles.streamingHeading}>Streaming favourites</Text>
          <Text style={styles.streamingSubheading}>
            Explore songs pulled from your connected accounts. Search to jump to a specific artist or
            track.
          </Text>
          <TextInput
            value={streamSearchQuery}
            onChangeText={setStreamSearchQuery}
            placeholder={hasStreamingConnection ? 'Search songs or artists' : 'Connect a service to begin'}
            placeholderTextColor={streamingPlaceholderColor}
            editable={hasStreamingConnection}
            style={styles.streamingSearchInput}
            accessibilityLabel={
              hasStreamingConnection ? 'Search your streaming favourites' : 'Streaming search disabled'
            }
            accessibilityState={{ disabled: !hasStreamingConnection }}
          />
          <View style={styles.streamingList}>
            {hasStreamingConnection ? (
              searchEmpty ? (
                <Text style={styles.streamingEmpty}>No matches yet—try a different song or artist.</Text>
              ) : (
                displayedFavorites.map((entry) => {
                  const { track, service: serviceId } = entry;
                  const badge = serviceNameMap[serviceId] ?? 'Streaming';
                  const isActive = activeFavorite?.track.id === track.id && activeFavorite.service === serviceId;
                  return (
                    <Pressable
                      key={`${serviceId}-${track.id}`}
                      style={styles.streamingItem}
                      onPress={() => handlePlayFavorite(serviceId, track)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isActive }}
                      accessibilityLabel={`Play ${track.title} by ${track.artist}`}
                    >
                      <View style={styles.streamingItemMeta}>
                        <Text style={styles.streamingItemTitle}>{track.title}</Text>
                        <View style={styles.streamingBadge} pointerEvents="none">
                          <Text style={styles.streamingBadgeText}>{badge}</Text>
                        </View>
                      </View>
                      <Text style={styles.streamingItemArtist}>{track.artist}</Text>
                    </Pressable>
                  );
                })
              )
            ) : (
              <Text style={styles.streamingEmpty}>
                Connect Apple Music or Spotify above to pull in a handful of your favourites.
              </Text>
            )}
          </View>
        </View>

        {primaryGroups.map((group) => (
          <View key={group.id} style={styles.groupSection}>
            <Text style={styles.groupTitle}>{group.label}</Text>
            <Text style={styles.groupDescription}>{group.intro}</Text>
            <View style={styles.optionList}>
              {group.options.map((option) => {
                const isActive = option.id === selectedTrackId && !activeFavorite;
                return (
                  <Pressable
                    key={option.id}
                    style={[styles.optionRow, isActive && styles.optionRowActive]}
                    onPress={() => handleSelectTrack(option.id)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isActive }}
                  >
                    <View style={[styles.optionEmojiWrap, isActive && styles.optionEmojiWrapActive]}>
                      <Text style={[styles.optionEmoji, isActive && styles.optionEmojiActive]}>{option.emoji}</Text>
                    </View>
                    <View style={styles.optionBody}>
                      <Text style={[styles.optionName, isActive && styles.optionNameActive]}>{option.name}</Text>
                      <Text style={styles.optionDescription}>{option.description}</Text>
                    </View>
                    {isActive ? <Text style={styles.optionBadge}>Playing</Text> : null}
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}

        {secondaryGroups.length > 0 ? (
          <View style={styles.groupSection}>
            <Pressable
              style={styles.groupToggle}
              onPress={() => setShowAllGroups((prev) => !prev)}
              accessibilityRole="button"
              accessibilityLabel={showAllGroups ? 'Hide additional mixes' : 'Show more mixes'}
            >
              <Text style={styles.groupToggleText}>{showAllGroups ? 'Hide more mixes' : 'Show more mixes'}</Text>
            </Pressable>
            {showAllGroups
              ? secondaryGroups.map((group) => (
                  <View key={group.id} style={styles.secondaryGroup}>
                    <Text style={styles.groupTitle}>{group.label}</Text>
                    <Text style={styles.groupDescription}>{group.intro}</Text>
                    <View style={styles.optionList}>
                      {group.options.map((option) => {
                        const isActive = option.id === selectedTrackId && !activeFavorite;
                        return (
                          <Pressable
                            key={option.id}
                            style={[styles.optionRow, isActive && styles.optionRowActive]}
                            onPress={() => handleSelectTrack(option.id)}
                            accessibilityRole="button"
                            accessibilityState={{ selected: isActive }}
                          >
                            <View style={[styles.optionEmojiWrap, isActive && styles.optionEmojiWrapActive]}>
                              <Text style={[styles.optionEmoji, isActive && styles.optionEmojiActive]}>{option.emoji}</Text>
                            </View>
                            <View style={styles.optionBody}>
                              <Text style={[styles.optionName, isActive && styles.optionNameActive]}>{option.name}</Text>
                              <Text style={styles.optionDescription}>{option.description}</Text>
                            </View>
                            {isActive ? <Text style={styles.optionBadge}>Playing</Text> : null}
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                ))
              : null}
          </View>
        ) : null}
      </ScrollView>

      <Modal
        visible={sleepModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setSleepModalOpen(false)}
      >
        <View style={styles.sleepOverlay}>
          <Pressable style={styles.sleepBackdrop} onPress={() => setSleepModalOpen(false)} />
          <View style={[styles.sleepCard, { paddingBottom: 24 + insets.bottom }]}>
            <View style={styles.sleepHandle} />
            <Text style={styles.sleepTitle}>Dream Capsule</Text>
            <Text style={styles.sleepDescription}>
              Set a fade-out timer or schedule a wake alarm—your Dream Capsule feels at home in light or
              dark mode.
            </Text>
            <View style={styles.sleepModeRow}>
              {SLEEP_MODE_OPTIONS.map((option) => {
                const isActive = sleepMode === option.id;
                return (
                  <Pressable
                    key={option.id}
                    style={[styles.sleepModeButton, isActive && styles.sleepModeButtonActive]}
                    onPress={() => setSleepMode(option.id)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isActive }}
                  >
                    <Text style={[styles.sleepModeLabel, isActive && styles.sleepModeLabelActive]}>
                      {option.label}
                    </Text>
                    <Text style={styles.sleepModeDescription}>{option.description}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.sleepSectionLabel}>
              {sleepMode === 'timer' ? 'Timer length' : 'Wake time'}
            </Text>
            {sleepMode === 'timer' ? (
              <View style={styles.sleepTimerGrid}>
                {SLEEP_TIMER_PRESETS.map((preset) => {
                  const isActive = sleepTimerMinutes === preset.minutes;
                  return (
                    <Pressable
                      key={preset.id}
                      style={[styles.sleepTimerButton, isActive && styles.sleepTimerButtonActive]}
                      onPress={() => setSleepTimerMinutes(preset.minutes)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isActive }}
                    >
                      <Text style={[styles.sleepTimerText, isActive && styles.sleepTimerTextActive]}>
                        {preset.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <View style={styles.alarmPickerRow}>
                <WheelPicker
                  data={ALARM_HOUR_OPTIONS}
                  value={alarmHour}
                  onChange={setAlarmHour}
                  label="Alarm hour"
                  styles={styles}
                />
                <Text style={styles.alarmPickerSeparator}>:</Text>
                <WheelPicker
                  data={ALARM_MINUTE_OPTIONS}
                  value={alarmMinute}
                  onChange={setAlarmMinute}
                  formatter={(value) => value.toString().padStart(2, '0')}
                  label="Alarm minute"
                  styles={styles}
                />
                <WheelPicker
                  data={ALARM_PERIOD_OPTIONS}
                  value={alarmPeriod}
                  onChange={setAlarmPeriod}
                  label="AM or PM"
                  styles={styles}
                />
              </View>
            )}
            <View style={styles.sleepActiveSummary}>
              <Text style={styles.sleepActiveHeadline}>{sleepSummary.headline}</Text>
              <Text style={styles.sleepActiveDetail}>{sleepSummary.detail}</Text>
            </View>
            <View style={styles.sleepActions}>
              <Pressable
                style={styles.sleepClearButton}
                onPress={handleClearSleepCircle}
                accessibilityRole="button"
              >
                <Text style={styles.sleepClearButtonText}>
                  {sleepCircle ? 'Clear capsule' : 'Cancel'}
                </Text>
              </Pressable>
              <Pressable
                style={styles.sleepApplyButton}
                onPress={handleApplySleepCircle}
                accessibilityRole="button"
              >
                <Text style={styles.sleepApplyButtonText}>
                  {sleepMode === 'timer' ? 'Set timer' : 'Set alarm'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

export default function MusicScreen() {
  const router = useRouter();
  return <MusicContent mode="screen" onRequestClose={() => router.back()} />;
}

type WheelValue = string | number;
type ThemedStyles = ReturnType<typeof createStyles>;

type WheelPickerProps<T extends WheelValue> = {
  data: readonly T[];
  value: T;
  onChange: (value: T) => void;
  formatter?: (value: T) => string;
  label?: string;
  styles: ThemedStyles;
};

function WheelPicker<T extends WheelValue>({
  data,
  value,
  onChange,
  formatter,
  label = 'Alarm time selector',
  styles,
}: WheelPickerProps<T>) {
  const scrollRef = useRef<ScrollView | null>(null);

  const formatValue = useCallback((item: T) => (formatter ? formatter(item) : String(item)), [formatter]);

  useEffect(() => {
    const index = data.findIndex((item) => item === value);
    if (index >= 0 && scrollRef.current) {
      scrollRef.current.scrollTo({ y: index * WHEEL_ITEM_HEIGHT, animated: true });
    }
  }, [data, value]);

  const handleMomentumEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offset = event.nativeEvent.contentOffset.y;
      const index = Math.min(data.length - 1, Math.max(0, Math.round(offset / WHEEL_ITEM_HEIGHT)));
      const next = data[index];
      if (next !== undefined && next !== value) {
        onChange(next);
      }
    },
    [data, onChange, value]
  );

  const initialIndex = Math.max(data.findIndex((item) => item === value), 0);

  return (
    <View style={styles.wheelPickerContainer} accessible accessibilityLabel={label}>
      <View style={styles.wheelPickerHighlight} pointerEvents="none" />
      <ScrollView
        ref={scrollRef}
        style={styles.wheelPickerScroll}
        contentContainerStyle={styles.wheelPickerContent}
        showsVerticalScrollIndicator={false}
        snapToInterval={WHEEL_ITEM_HEIGHT}
        decelerationRate="fast"
        snapToAlignment="center"
        onMomentumScrollEnd={handleMomentumEnd}
        onScrollEndDrag={handleMomentumEnd}
        contentOffset={{ x: 0, y: initialIndex * WHEEL_ITEM_HEIGHT }}
      >
        {data.map((item) => {
          const formatted = formatValue(item);
          const isActive = item === value;
          return (
            <View key={String(item)} style={styles.wheelPickerItem}>
              <Text style={[styles.wheelPickerText, isActive && styles.wheelPickerTextActive]}>{formatted}</Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}





