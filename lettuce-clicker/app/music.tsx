import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Vibration,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAudioPlayer } from 'expo-audio';
import { ALARM_CHIME_DATA_URI } from '@/assets/audio/alarmChime';
import type { ColorScheme } from '@/context/ThemeContext';
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

const MUSIC_AUDIO_MAP = {
  'white-hush': require('@/assets/audio/soft-soothing-deep-white-noise-378857.mp3'),
  'white-waves': require('@/assets/audio/heavy-rain-white-noise-159772.mp3'),
  'white-sparks': require('@/assets/audio/large-industrial-fan-running-constantly-in-warehouse-environment-339216.mp3'),
  'grey-mist': require('@/assets/audio/kitchen-fan-71401.mp3'),
  'grey-embers': require('@/assets/audio/fire-place-189399.mp3'),
  'grey-lanterns': require('@/assets/audio/street-ambience-traffic-410714.mp3'),
  'rain-mist': require('@/assets/audio/gentle-rain-for-relaxation-and-sleep-337279.mp3'),
  'rain-thunder': require('@/assets/audio/copyright-free-rain-sounds-331497.mp3'),
  'ocean-tide': require('@/assets/audio/rowing-river-sounds-215254.mp3'),
  'ocean-depths': require('@/assets/audio/river-sounds-420904.mp3'),
  'forest-dawn': require('@/assets/audio/chirping-birds-ambience-217410-1.mp3'),
  'forest-twilight': require('@/assets/audio/avala-trail-forest-nature-246779.mp3'),
  'static-amber': require('@/assets/audio/large-industrial-fan-running-constantly-in-warehouse-environment-339216.mp3'),
  'static-stars': require('@/assets/audio/soft-soothing-deep-white-noise-378857.mp3'),
  'keys-glass': require('@/assets/audio/river-sounds-420904.mp3'),
  'keys-nocturne': require('@/assets/audio/street-ambience-traffic-410714.mp3'),
  'night-orbit': require('@/assets/audio/soft-soothing-deep-white-noise-378857.mp3'),
  'night-halo': require('@/assets/audio/gentle-rain-for-relaxation-and-sleep-337279.mp3'),
} as const satisfies Record<(typeof MUSIC_OPTIONS)[number]['id'], number>;

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
  { id: 'apple', name: 'Apple Music', emoji: '🍎', description: 'Link your personal library and curated stations.' },
  { id: 'spotify', name: 'Spotify', emoji: '🟢', description: 'Stream playlists and blends from your account.' },
] as const;

const SERVICE_NOW_PLAYING: Record<MusicServiceId, { emoji: string; title: string; subtitle: string }> = {
  apple: {
    emoji: '🍎',
    title: 'Morning Bloom Radio',
    subtitle: 'Playing from your Apple Music connection.',
  },
  spotify: {
    emoji: '🟢',
    title: 'Focus Flow',
    subtitle: 'Streaming from your Spotify playlists.',
  },
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
  sourcePillBackground: string;
  sourcePillBorder: string;
  sourcePillActiveBackground: string;
  sourcePillActiveBorder: string;
  sourcePillText: string;
  sourcePillActiveText: string;
  sourcePillShadow: string;
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
  optionVisualizerRing: string;
  optionVisualizerCore: string;
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
  sourcePillBackground: 'rgba(7, 28, 19, 0.9)',
  sourcePillBorder: 'rgba(77, 255, 166, 0.3)',
  sourcePillActiveBackground: '#2dd78f',
  sourcePillActiveBorder: '#2dd78f',
  sourcePillText: '#caffd6',
  sourcePillActiveText: '#062014',
  sourcePillShadow: '#2dd78f',
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
  optionVisualizerRing: 'rgba(77, 255, 166, 0.55)',
  optionVisualizerCore: 'rgba(45, 215, 143, 0.55)',
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
  sourcePillBackground: '#f1f9f4',
  sourcePillBorder: '#caead9',
  sourcePillActiveBackground: '#2dd78f',
  sourcePillActiveBorder: '#2dd78f',
  sourcePillText: '#205c42',
  sourcePillActiveText: '#073621',
  sourcePillShadow: 'rgba(45, 215, 143, 0.35)',
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
  optionVisualizerRing: 'rgba(31, 122, 83, 0.45)',
  optionVisualizerCore: 'rgba(45, 215, 143, 0.4)',
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
      gap: 0,
    },
    headerSide: {
      flex: 1,
      minWidth: 96,
      flexDirection: 'row',
      alignItems: 'center',
    },
    headerSideLeft: {
      justifyContent: 'flex-start',
    },
    headerSideRight: {
      justifyContent: 'flex-end',
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
      flexShrink: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      paddingHorizontal: 4,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: '800',
      color: palette.headerTitle,
      textAlign: 'center',
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 8,
      width: '100%',
    },
    headerActionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 8,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: 'transparent',
      borderWidth: 0,
      shadowOpacity: 0,
      shadowRadius: 0,
      shadowOffset: { width: 0, height: 0 },
      elevation: 0,
    },
    headerActionGlyph: {
      fontSize: 20,
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
      flexDirection: 'row',
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
    },
    nowPlayingTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: palette.nowPlayingTitle,
    },
    nowPlayingSubtitle: {
      fontSize: 13,
      lineHeight: 18,
      color: palette.nowPlayingSubtitle,
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
    nowPlayingControls: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
    },
    nowPlayingControlButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: palette.sourcePillBorder,
      backgroundColor: palette.sourcePillBackground,
    },
    nowPlayingControlButtonActive: {
      backgroundColor: palette.sourcePillActiveBackground,
      borderColor: palette.sourcePillActiveBorder,
      shadowColor: palette.sourcePillShadow,
      shadowOpacity: isDark ? 0.35 : 0.18,
      shadowRadius: isDark ? 10 : 8,
      shadowOffset: { width: 0, height: isDark ? 6 : 4 },
      elevation: isDark ? 4 : 2,
    },
    nowPlayingControlGlyph: {
      fontSize: 16,
      color: palette.sourcePillText,
    },
    nowPlayingControlGlyphActive: {
      color: palette.sourcePillActiveText,
    },
    nowPlayingControlText: {
      fontSize: 14,
      fontWeight: '700',
      color: palette.sourcePillText,
    },
    nowPlayingControlTextActive: {
      color: palette.sourcePillActiveText,
    },
    nowPlayingSources: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    sourcePill: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: palette.sourcePillBorder,
      backgroundColor: palette.sourcePillBackground,
    },
    sourcePillActive: {
      backgroundColor: palette.sourcePillActiveBackground,
      borderColor: palette.sourcePillActiveBorder,
      shadowColor: palette.sourcePillShadow,
      shadowOpacity: isDark ? 0.35 : 0.18,
      shadowRadius: isDark ? 10 : 8,
      shadowOffset: { width: 0, height: isDark ? 6 : 4 },
      elevation: isDark ? 4 : 2,
    },
    sourcePillText: {
      fontSize: 13,
      fontWeight: '600',
      color: palette.sourcePillText,
    },
    sourcePillTextActive: {
      color: palette.sourcePillActiveText,
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
      shadowColor: palette.optionRowShadow,
      shadowOpacity: isDark ? 0.35 : 0.16,
    },
    optionAvatar: {
      width: 52,
      height: 52,
      alignItems: 'center',
      justifyContent: 'center',
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
      color: palette.optionNameActive,
      fontWeight: '800',
    },
    optionVisualizer: {
      width: 52,
      height: 52,
      borderRadius: 26,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'visible',
    },
    optionVisualizerPulse: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      borderRadius: 26,
      borderWidth: 2,
    },
    optionVisualizerPulseSecondary: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      borderRadius: 26,
      borderWidth: 2,
    },
    optionVisualizerCore: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: 'center',
      justifyContent: 'center',
      shadowOpacity: isDark ? 0.45 : 0.22,
      shadowRadius: isDark ? 12 : 8,
      shadowOffset: { width: 0, height: isDark ? 6 : 4 },
      elevation: isDark ? 4 : 2,
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
type MusicSource = 'mix' | MusicServiceId;
type SleepMode = (typeof SLEEP_MODE_OPTIONS)[number]['id'];
type AlarmPeriod = 'AM' | 'PM';

type SleepCircleState =
  | { mode: 'timer'; duration: number; targetTimestamp: number }
  | { mode: 'alarm'; fireTimestamp: number; hour: number; minute: number; period: AlarmPeriod }
  | null;

type MusicContentProps = {
  mode?: 'screen' | 'modal';
  onRequestClose?: () => void;
};

export function MusicContent({ mode = 'screen', onRequestClose }: MusicContentProps) {
  const insets = useSafeAreaInsets();
  const { colorScheme: appColorScheme } = useAppTheme();
  const [musicColorScheme, setMusicColorScheme] = useState<ColorScheme>(appColorScheme);
  useEffect(() => {
    setMusicColorScheme(appColorScheme);
  }, [appColorScheme]);
  const isDark = musicColorScheme === 'dark';
  const palette = isDark ? DARK_PALETTE : LIGHT_PALETTE;
  const styles = useMemo(
    () =>
      createStyles(
        palette,
        isDark
      ),
    [palette, isDark]
  );
  const themeToggleHint =
    musicColorScheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
  const themeAccessibilityValue =
    musicColorScheme === 'dark' ? 'Dark mode active' : 'Light mode active';
  const [selectedTrackId, setSelectedTrackId] = useState<MusicOption['id']>(MUSIC_OPTIONS[0].id);
  const [connectedServices, setConnectedServices] = useState<Record<MusicServiceId, boolean>>({
    apple: false,
    spotify: false,
  });
  const [nowPlayingSource, setNowPlayingSource] = useState<MusicSource>('mix');
  const [sleepModalOpen, setSleepModalOpen] = useState(false);
  const [sleepMode, setSleepMode] = useState<SleepMode>('timer');
  const [sleepTimerMinutes, setSleepTimerMinutes] = useState<number>(30);
  const [alarmHour, setAlarmHour] = useState<number>(7);
  const [alarmMinute, setAlarmMinute] = useState<number>(0);
  const [alarmPeriod, setAlarmPeriod] = useState<AlarmPeriod>('AM');
  const [sleepCircle, setSleepCircle] = useState<SleepCircleState>(null);
  const [sleepNow, setSleepNow] = useState(() => Date.now());
  const sleepTimeoutRef = useRef<number | null>(null);
  const ambientPlayer = useAudioPlayer(MUSIC_AUDIO_MAP[selectedTrackId]);
  const alarmPlayer = useAudioPlayer(ALARM_SOUND_URI);
  const [ambientError, setAmbientError] = useState<Error | null>(null);
  const [isAmbientPlaying, setIsAmbientPlaying] = useState(false);
  const [showAllGroups, setShowAllGroups] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setSleepNow(Date.now());
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
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

  useEffect(() => {
    if (nowPlayingSource !== 'mix' && !connectedServices[nowPlayingSource]) {
      setNowPlayingSource('mix');
    }
  }, [connectedServices, nowPlayingSource]);

  const availableSources = useMemo(() => {
    const sources: { id: MusicSource; label: string }[] = [{ id: 'mix', label: 'Garden mix' }];
    MUSIC_SERVICES.forEach((service) => {
      if (connectedServices[service.id]) {
        sources.push({ id: service.id, label: service.name });
      }
    });
    return sources;
  }, [connectedServices]);

  const nowPlayingDetails = useMemo(() => {
    if (nowPlayingSource === 'mix') {
      return {
        emoji: selectedTrack.emoji,
        title: selectedTrack.name,
        subtitle: selectedTrack.description,
      };
    }

    if (!connectedServices[nowPlayingSource]) {
      return {
        emoji: selectedTrack.emoji,
        title: selectedTrack.name,
        subtitle: selectedTrack.description,
      };
    }

    return SERVICE_NOW_PLAYING[nowPlayingSource];
  }, [connectedServices, nowPlayingSource, selectedTrack]);

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

  const handleToggleService = useCallback(
    (serviceId: MusicServiceId) => {
      setConnectedServices((prev) => {
        const next = { ...prev, [serviceId]: !prev[serviceId] };
        if (next[serviceId]) {
          setNowPlayingSource(serviceId);
        } else if (nowPlayingSource === serviceId) {
          setNowPlayingSource('mix');
        }
        return next;
      });
    },
    [nowPlayingSource]
  );

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

  const handleToggleMusicTheme = useCallback(() => {
    setMusicColorScheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const ensureLoopingPlayback = useCallback(
    async (source: number, shouldPlayOverride?: boolean) => {
      const player: any = ambientPlayer;
      const desiredPlayState = shouldPlayOverride ?? (nowPlayingSource === 'mix' && isAmbientPlaying);

      try {
        const playbackOptions = {
          isLooping: true,
          shouldPlay: desiredPlayState,
        };

        let startedWithSource = false;
        if (player && typeof player.replace === 'function') {
          await Promise.resolve(player.replace(source, playbackOptions));
          startedWithSource = true;
        } else if (player && typeof player.loadAsync === 'function') {
          await Promise.resolve(player.stop?.());
          await Promise.resolve(player.unloadAsync?.());
          await Promise.resolve(player.loadAsync(source, playbackOptions));
        } else if (player && typeof player.play === 'function' && player.play.length >= 1) {
          await Promise.resolve(player.play(source, playbackOptions));
          startedWithSource = true;
        } else if (player && typeof player.setSource === 'function') {
          await Promise.resolve(player.setSource(source));
        }

        if (player) {
          if (typeof player.setStatus === 'function') {
            await Promise.resolve(player.setStatus({ isLooping: true }));
          } else if (typeof player.updateStatus === 'function') {
            await Promise.resolve(player.updateStatus({ isLooping: true }));
          }

          if (desiredPlayState) {
            if (!startedWithSource) {
              if (typeof player.play === 'function' && player.play.length === 0) {
                await Promise.resolve(player.play());
              } else if (typeof player.playAsync === 'function') {
                await Promise.resolve(player.playAsync());
              } else if (typeof player.replayAsync === 'function') {
                await Promise.resolve(player.replayAsync());
              } else {
                player.seekTo?.(0);
                player.play?.();
              }
            }
            setIsAmbientPlaying(true);
          } else {
            player.pause?.();
            setIsAmbientPlaying(false);
          }
        } else {
          setIsAmbientPlaying(false);
        }

        setAmbientError(null);
      } catch (error) {
        console.warn('Ambient playback failed', error);
        setIsAmbientPlaying(false);
        setAmbientError(
          error instanceof Error ? error : new Error('Ambient playback failed to start')
        );
      }
    },
    [ambientPlayer, isAmbientPlaying, nowPlayingSource]
  );

  useEffect(() => {
    if (nowPlayingSource !== 'mix') {
      const player: any = ambientPlayer;
      player?.pause?.();
      setIsAmbientPlaying(false);
      setAmbientError(null);
      return;
    }

    const source = MUSIC_AUDIO_MAP[selectedTrackId];
    if (!source) {
      return;
    }

    ensureLoopingPlayback(source);
  }, [ambientPlayer, ensureLoopingPlayback, nowPlayingSource, selectedTrackId]);

  const handleSelectTrack = useCallback(
    (trackId: MusicOption['id']) => {
      setSelectedTrackId(trackId);
      setNowPlayingSource('mix');
      setAmbientError(null);

      const source = MUSIC_AUDIO_MAP[trackId];
      if (source) {
        ensureLoopingPlayback(source, true).catch((error) => {
          console.warn('Playback failed to start', error);
        });
      }
    },
    [ensureLoopingPlayback]
  );

  const handleSelectSource = useCallback(
    (sourceId: MusicSource) => {
      setAmbientError(null);
      if (sourceId === 'mix') {
        setNowPlayingSource('mix');
        const source = MUSIC_AUDIO_MAP[selectedTrackId];
        if (source) {
          ensureLoopingPlayback(source, true).catch((error) => {
            console.warn('Playback failed to start', error);
          });
        }
        return;
      }

      setNowPlayingSource(sourceId);
      setIsAmbientPlaying(false);
      const player: any = ambientPlayer;
      player?.pause?.();
    },
    [ambientPlayer, ensureLoopingPlayback, selectedTrackId]
  );

  const handleToggleAmbientPlayback = useCallback(() => {
    if (nowPlayingSource !== 'mix') {
      return;
    }

    const source = MUSIC_AUDIO_MAP[selectedTrackId];
    if (!source) {
      return;
    }

    setAmbientError(null);
    const nextShouldPlay = !isAmbientPlaying;
    ensureLoopingPlayback(source, nextShouldPlay).catch((error) => {
      console.warn('Playback toggle failed', error);
    });
  }, [ensureLoopingPlayback, isAmbientPlaying, nowPlayingSource, selectedTrackId]);

  useEffect(() => {
    const player: any = ambientPlayer;
    return () => {
      player?.stop?.();
      player?.unloadAsync?.();
    };
  }, [ambientPlayer]);

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
          <View style={[styles.headerSide, styles.headerSideLeft]}>
            <Pressable
              onPress={handleClose}
              style={styles.headerBackButton}
              accessibilityRole="button"
              accessibilityLabel={headerBackAccessibility}
            >
              <Text style={styles.headerBackText}>{headerBackText}</Text>
            </Pressable>
          </View>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Music Lounge</Text>
          </View>
          <View style={[styles.headerSide, styles.headerSideRight]}>
            <View style={styles.headerActions}>
              <Pressable
                onPress={handleToggleMusicTheme}
                style={styles.headerActionButton}
                accessibilityRole="button"
                accessibilityLabel="Toggle light or dark mode"
                accessibilityHint={themeToggleHint}
                accessibilityValue={{ text: themeAccessibilityValue }}
                hitSlop={8}
              >
                <Text style={styles.headerActionGlyph}>🌙</Text>
              </Pressable>
              <Pressable
                onPress={handleOpenSleepModal}
                style={styles.headerActionButton}
                accessibilityRole="button"
                accessibilityLabel="Open Dream Capsule controls"
                accessibilityHint="Set timers or wake alarms"
                accessibilityValue={{ text: sleepSummary.headline }}
                hitSlop={8}
              >
                <Text style={styles.headerActionGlyph}>⏰</Text>
              </Pressable>
            </View>
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
            {ambientError ? (
              <Text style={styles.sleepStatusWarning}>
                Ambient mix playback is unavailable. Try another sound or reconnect audio.
              </Text>
            ) : null}
          </View>
          {nowPlayingSource === 'mix' ? (
            <View style={styles.nowPlayingControls}>
              <Pressable
                onPress={handleToggleAmbientPlayback}
                style={[
                  styles.nowPlayingControlButton,
                  isAmbientPlaying && styles.nowPlayingControlButtonActive,
                ]}
                accessibilityRole="button"
                accessibilityLabel={isAmbientPlaying ? 'Pause garden mix' : 'Play garden mix'}
                accessibilityHint={
                  isAmbientPlaying
                    ? 'Pauses the currently playing ambience'
                    : 'Starts the selected ambience mix'
                }
              >
                <Text
                  style={[
                    styles.nowPlayingControlGlyph,
                    isAmbientPlaying && styles.nowPlayingControlGlyphActive,
                  ]}
                >
                  {isAmbientPlaying ? '⏸️' : '▶️'}
                </Text>
                <Text
                  style={[
                    styles.nowPlayingControlText,
                    isAmbientPlaying && styles.nowPlayingControlTextActive,
                  ]}
                >
                  {isAmbientPlaying ? 'Pause mix' : 'Play mix'}
                </Text>
              </Pressable>
            </View>
          ) : null}
          <View style={styles.nowPlayingSources}>
            {availableSources.map((source) => {
              const isActive = nowPlayingSource === source.id;
              return (
                <Pressable
                  key={source.id}
                  style={[styles.sourcePill, isActive && styles.sourcePillActive]}
                  onPress={() => handleSelectSource(source.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                  accessibilityLabel={`Play from ${source.label}`}
                >
                  <Text style={[styles.sourcePillText, isActive && styles.sourcePillTextActive]}>
                    {source.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.serviceSection}>
          <Text style={styles.sectionTitle}>Connect your music</Text>
          <Text style={styles.sectionSubtitle}>
            Link Apple Music or Spotify to stream your own playlists inside the lounge.
          </Text>
          <View style={styles.serviceList}>
            {MUSIC_SERVICES.map((service) => {
              const connected = connectedServices[service.id];
              return (
                <Pressable
                  key={service.id}
                  style={[styles.serviceCard, connected && styles.serviceCardConnected]}
                  onPress={() => handleToggleService(service.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: connected }}
                  accessibilityLabel={connected ? `Disconnect ${service.name}` : `Connect ${service.name}`}
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
                      {connected ? 'Connected · tap to switch sources' : 'Tap to connect'}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        {primaryGroups.map((group) => (
          <View key={group.id} style={styles.groupSection}>
            <Text style={styles.groupTitle}>{group.label}</Text>
            <Text style={styles.groupDescription}>{group.intro}</Text>
            <View style={styles.optionList}>
              {group.options.map((option) => {
                const isActive = option.id === selectedTrackId && nowPlayingSource === 'mix';
                return (
                  <Pressable
                    key={option.id}
                    style={[styles.optionRow, isActive && styles.optionRowActive]}
                    onPress={() => handleSelectTrack(option.id)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isActive }}
                  >
                    <View style={styles.optionAvatar}>
                      {isActive ? (
                        <AudioOrb emoji={option.emoji} palette={palette} styles={styles} />
                      ) : (
                        <View style={styles.optionEmojiWrap}>
                          <Text style={styles.optionEmoji}>{option.emoji}</Text>
                        </View>
                      )}
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
                        const isActive = option.id === selectedTrackId && nowPlayingSource === 'mix';
                        return (
                          <Pressable
                            key={option.id}
                            style={[styles.optionRow, isActive && styles.optionRowActive]}
                            onPress={() => handleSelectTrack(option.id)}
                            accessibilityRole="button"
                            accessibilityState={{ selected: isActive }}
                          >
                            <View style={styles.optionAvatar}>
                              {isActive ? (
                                <AudioOrb emoji={option.emoji} palette={palette} styles={styles} />
                              ) : (
                                <View style={styles.optionEmojiWrap}>
                                  <Text style={styles.optionEmoji}>{option.emoji}</Text>
                                </View>
                              )}
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

type AudioOrbProps = {
  emoji: string;
  palette: Palette;
  styles: ThemedStyles;
};

function AudioOrb({ emoji, palette, styles }: AudioOrbProps) {
  const primaryPulse = useRef(new Animated.Value(0)).current;
  const secondaryPulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const primaryAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(primaryPulse, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(primaryPulse, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    const secondaryAnimation = Animated.loop(
      Animated.sequence([
        Animated.delay(800),
        Animated.timing(secondaryPulse, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(secondaryPulse, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    primaryAnimation.start();
    secondaryAnimation.start();

    return () => {
      primaryAnimation.stop();
      secondaryAnimation.stop();
      primaryPulse.stopAnimation();
      secondaryPulse.stopAnimation();
    };
  }, [primaryPulse, secondaryPulse]);

  const primaryScale = primaryPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.45] });
  const primaryOpacity = primaryPulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] });
  const secondaryScale = secondaryPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.65] });
  const secondaryOpacity = secondaryPulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0] });
  const coreScale = primaryPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });

  return (
    <View style={styles.optionVisualizer}>
      <Animated.View
        style={[
          styles.optionVisualizerPulse,
          {
            borderColor: palette.optionVisualizerRing,
            transform: [{ scale: primaryScale }],
            opacity: primaryOpacity,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.optionVisualizerPulseSecondary,
          {
            borderColor: palette.optionVisualizerRing,
            transform: [{ scale: secondaryScale }],
            opacity: secondaryOpacity,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.optionVisualizerCore,
          {
            backgroundColor: palette.optionVisualizerCore,
            shadowColor: palette.optionVisualizerRing,
            transform: [{ scale: coreScale }],
          },
        ]}
      >
        <Text style={[styles.optionEmoji, styles.optionEmojiActive]}>{emoji}</Text>
      </Animated.View>
    </View>
  );
}

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





