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
  useWindowDimensions,
  View,
  Vibration,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAudioPlayer } from 'expo-audio';
import { ALARM_CHIME_DATA_URI } from '@/assets/audio/alarmChime';
import { MUSIC_GROUPS, MUSIC_OPTIONS, type MusicOption } from '@/constants/music';
import { useAmbientAudio } from '@/context/AmbientAudioContext';
import type { ColorScheme } from '@/context/ThemeContext';
import { useAppTheme } from '@/context/ThemeContext';
import { useGame } from '@/context/GameContext';


const SLEEP_MODE_OPTIONS = [
  { id: 'timer', label: 'Timer', description: 'Fade out and stop playback when the time ends.' },
  { id: 'alarm', label: 'Wake alarm', description: 'Play gentle chimes at your wake time.' },
] as const;

const TIMER_MINUTE_OPTIONS = Array.from({ length: 36 }, (_, index) => (index + 1) * 5);

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
  nowPlayingControlBackground: string;
  nowPlayingControlBorder: string;
  nowPlayingControlIcon: string;
  nowPlayingControlIconActive: string;
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
  nowPlayingControlBackground: 'rgba(77, 255, 166, 0.18)',
  nowPlayingControlBorder: 'rgba(77, 255, 166, 0.45)',
  nowPlayingControlIcon: '#f6fff6',
  nowPlayingControlIconActive: '#062014',
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
  nowPlayingControlBackground: '#e1f3e7',
  nowPlayingControlBorder: '#2dd78f',
  nowPlayingControlIcon: '#0f3d2b',
  nowPlayingControlIconActive: '#0f3d2b',
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

const createStyles = (palette: Palette, isDark: boolean, sleepSheetMaxHeight: number) =>
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
      width: 72,
      height: 72,
      borderRadius: 36,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'visible',
    },
    nowPlayingEmojiStatic: {
      width: 56,
      height: 56,
      borderRadius: 28,
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
      padding: 12,
      borderRadius: 16,
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
    sleepStatusBlockHeadline: {
      fontSize: 13,
      fontWeight: '600',
      color: palette.sleepStatusHeadline,
    },
    sleepStatusWarning: {
      fontSize: 11,
      color: palette.sleepStatusWarning,
    },
    nowPlayingControls: {
      marginTop: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
    },
    nowPlayingControlButton: {
      width: 54,
      height: 54,
      borderRadius: 27,
      borderWidth: 2,
      borderColor: palette.nowPlayingControlBorder,
      backgroundColor: palette.nowPlayingControlBackground,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: palette.cardShadow,
      shadowOpacity: isDark ? 0.5 : 0.18,
      shadowRadius: isDark ? 16 : 10,
      shadowOffset: { width: 0, height: isDark ? 10 : 6 },
      elevation: isDark ? 5 : 2,
    },
    nowPlayingControlButtonPrimary: {
      width: 68,
      height: 68,
      borderRadius: 34,
      borderWidth: 2.5,
    },
    nowPlayingControlButtonActive: {
      transform: [{ scale: 1.05 }],
      backgroundColor: palette.sourcePillActiveBackground,
      borderColor: palette.sourcePillActiveBorder,
    },
    nowPlayingControlButtonPrimaryActive: {
      transform: [{ scale: 1.08 }],
    },
    nowPlayingPrimaryIconWrap: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    nowPlayingPlayIcon: {
      marginLeft: 2,
    },
    sleepProgressWrapper: {
      marginTop: 10,
      width: '100%',
      paddingHorizontal: 8,
    },
    sleepProgressTrack: {
      width: '100%',
      height: 6,
      borderRadius: 999,
      backgroundColor: palette.sleepTimerBorder,
      overflow: 'hidden',
    },
    sleepProgressFill: {
      height: '100%',
      borderRadius: 999,
      backgroundColor: palette.sleepTimerBackgroundActive,
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
      justifyContent: 'center',
      paddingHorizontal: 12,
      paddingVertical: 18,
    },
    sleepBackdrop: {
      ...StyleSheet.absoluteFillObject,
    },
    sleepCard: {
      backgroundColor: palette.modalBackground,
      borderRadius: 24,
      width: '100%',
      maxWidth: 560,
      alignSelf: 'center',
      marginHorizontal: 0,
      paddingTop: 0,
      paddingBottom: 0,
      maxHeight: sleepSheetMaxHeight,
      overflow: 'hidden',
    },
    sleepCardGlow: {
      ...StyleSheet.absoluteFillObject,
      opacity: 0.3,
      borderRadius: 24,
      backgroundColor: palette.modalHandle,
    },
    sleepCardScroll: {
      flexGrow: 0,
      maxHeight: sleepSheetMaxHeight - 72,
    },
    sleepContent: {
      paddingHorizontal: 20,
      paddingTop: 18,
      paddingBottom: 24,
      gap: 18,
    },
    sleepHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 10,
    },
    sleepHeaderBadge: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: palette.sleepModeBackgroundActive,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: palette.sleepModeBorderActive,
      shadowOpacity: 0.2,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 3,
    },
    sleepHeaderEmoji: {
      fontSize: 26,
    },
    sleepHeaderText: {
      flex: 1,
      gap: 6,
    },
    sleepTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: palette.modalTitle,
      textAlign: 'left',
    },
    sleepDescription: {
      fontSize: 12,
      color: palette.modalDescription,
      textAlign: 'left',
      lineHeight: 17,
    },
    sleepColumns: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 18,
    },
    sleepColumn: {
      flex: 1,
      minWidth: 200,
      gap: 14,
    },
    sleepColumnPrimary: {
      maxWidth: 280,
    },
    sleepColumnSecondary: {
      flexBasis: 0,
    },
    sleepModeList: {
      flexDirection: 'column',
      gap: 10,
    },
    sleepModeButton: {
      flex: 1,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: palette.sleepModeBorder,
      paddingVertical: 12,
      paddingHorizontal: 12,
      gap: 4,
      backgroundColor: palette.sleepModeBackground,
    },
    sleepModeButtonActive: {
      backgroundColor: palette.sleepModeBackgroundActive,
      borderColor: palette.sleepModeBorderActive,
    },
    sleepModeLabel: {
      fontSize: 13,
      fontWeight: '700',
      color: palette.sleepModeLabel,
    },
    sleepModeLabelActive: {
      color: palette.sleepModeLabelActive,
    },
    sleepModeDescription: {
      fontSize: 11,
      color: palette.sleepModeDescription,
      lineHeight: 15,
    },
    sleepSectionLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: palette.sleepSectionLabel,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
    sleepTimerWheelRow: {
      marginTop: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sleepTimerReadoutCard: {
      alignItems: 'flex-start',
      gap: 4,
    },
    sleepStatusPanel: {
      borderRadius: 14,
      padding: 12,
      backgroundColor: palette.sleepModeBackground,
      borderWidth: 1,
      borderColor: palette.sleepModeBorder,
      gap: 4,
    },
    sleepStatusHeadline: {
      fontSize: 13,
      fontWeight: '700',
      color: palette.sleepModeLabel,
    },
    sleepStatusCopy: {
      fontSize: 11,
      color: palette.sleepModeDescription,
      lineHeight: 15,
    },
    sleepTimerReadoutValue: {
      fontSize: 22,
      fontWeight: '700',
      color: palette.sleepTimerText,
    },
    sleepTimerReadoutHint: {
      fontSize: 11,
      color: palette.sleepModeDescription,
    },
    timerActionList: {
      marginTop: 12,
      flexDirection: 'column',
      gap: 10,
    },
    timerActionCard: {
      flex: 1,
      minWidth: 150,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: palette.sleepTimerBorder,
      backgroundColor: palette.sleepTimerBackground,
      paddingVertical: 12,
      paddingHorizontal: 12,
      gap: 6,
    },
    timerActionCardActive: {
      borderColor: palette.sleepTimerBorderActive,
      backgroundColor: palette.sleepTimerBackgroundActive,
    },
    timerActionLabel: {
      fontSize: 13,
      fontWeight: '700',
      color: palette.sleepTimerText,
    },
    timerActionLabelActive: {
      color: palette.sleepTimerTextActive,
    },
    timerActionDescription: {
      fontSize: 11,
      lineHeight: 15,
      color: palette.sleepModeDescription,
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
    alarmSummaryCard: {
      borderRadius: 20,
      paddingVertical: 14,
      paddingHorizontal: 16,
      backgroundColor: palette.sleepModeBackground,
      borderWidth: 1,
      borderColor: palette.sleepModeBorder,
      gap: 4,
    },
    alarmSummaryLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: palette.sleepModeLabel,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
    },
    alarmSummaryValue: {
      fontSize: 20,
      fontWeight: '700',
      color: palette.sleepTimerText,
    },
    sleepActiveSummary: {
      gap: 4,
      alignItems: 'flex-start',
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

const clampTimerMinutes = (minutes: number) => {
  if (!Number.isFinite(minutes)) {
    return TIMER_MINUTE_OPTIONS[0];
  }

  const minimum = TIMER_MINUTE_OPTIONS[0];
  const maximum = TIMER_MINUTE_OPTIONS[TIMER_MINUTE_OPTIONS.length - 1];
  const clamped = Math.max(minimum, Math.min(minutes, maximum));

  let closest = minimum;
  let smallestDelta = Math.abs(closest - clamped);
  for (const option of TIMER_MINUTE_OPTIONS) {
    const delta = Math.abs(option - clamped);
    if (delta < smallestDelta) {
      closest = option;
      smallestDelta = delta;
    }
  }

  return closest;
};

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

type SleepMode = (typeof SLEEP_MODE_OPTIONS)[number]['id'];
type AlarmPeriod = 'AM' | 'PM';

type TimerAction = 'stop' | 'alarm';

const TIMER_ACTION_OPTIONS: { id: TimerAction; title: string; description: string }[] = [
  { id: 'stop', title: 'Fade out audio', description: 'Stop ambience when the timer completes.' },
  {
    id: 'alarm',
    title: 'Pause & chime',
    description: 'Pause ambience and play a gentle alarm until you stop it.',
  },
];

type SleepCircleState =
  | { mode: 'timer'; duration: number; targetTimestamp: number; startedAt: number; action: TimerAction }
  | {
      mode: 'alarm';
      fireTimestamp: number;
      hour: number;
      minute: number;
      period: AlarmPeriod;
      scheduledAt: number;
    }
  | null;

type MusicContentProps = {
  mode?: 'screen' | 'modal';
  onRequestClose?: () => void;
};

export function MusicContent({ mode = 'screen', onRequestClose }: MusicContentProps) {
  const insets = useSafeAreaInsets();
  const { colorScheme: appColorScheme } = useAppTheme();
  const { gardenBackgroundColor } = useGame();
  const [musicColorScheme, setMusicColorScheme] = useState<ColorScheme>(appColorScheme);
  useEffect(() => {
    setMusicColorScheme(appColorScheme);
  }, [appColorScheme]);
  const isDark = musicColorScheme === 'dark';
  const gardenSurface = useMemo(
    () =>
      gardenBackgroundColor && gardenBackgroundColor.trim().length > 0
        ? gardenBackgroundColor
        : LIGHT_PALETTE.background,
    [gardenBackgroundColor]
  );
  const palette = useMemo(
    () =>
      isDark
        ? DARK_PALETTE
        : { ...LIGHT_PALETTE, background: gardenSurface, modalBackground: gardenSurface },
    [gardenSurface, isDark]
  );
  const { height: windowHeight } = useWindowDimensions();
  const sleepSheetMaxHeight = useMemo(
    () => Math.max(windowHeight - insets.top - 48, 420),
    [insets.top, windowHeight]
  );
  const styles = useMemo(
    () => createStyles(palette, isDark, sleepSheetMaxHeight),
    [palette, isDark, sleepSheetMaxHeight]
  );
  const themeToggleHint =
    musicColorScheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
  const themeAccessibilityValue =
    musicColorScheme === 'dark' ? 'Dark mode active' : 'Light mode active';
  const {
    selectedTrackId,
    isPlaying: isAmbientPlaying,
    error: ambientError,
    selectTrack,
    togglePlayback,
    pause: pauseAmbient,
  } = useAmbientAudio();
  const [sleepModalOpen, setSleepModalOpen] = useState(false);
  const [sleepMode, setSleepMode] = useState<SleepMode>('timer');
  const [sleepTimerMinutes, setSleepTimerMinutes] = useState<number>(30);
  const [sleepTimerAction, setSleepTimerAction] = useState<TimerAction>('stop');
  const [alarmHour, setAlarmHour] = useState<number>(7);
  const [alarmMinute, setAlarmMinute] = useState<number>(0);
  const [alarmPeriod, setAlarmPeriod] = useState<AlarmPeriod>('AM');
  const [sleepCircle, setSleepCircle] = useState<SleepCircleState>(null);
  const [sleepNow, setSleepNow] = useState(() => Date.now());
  const sleepTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const alarmPlayer = useAudioPlayer(ALARM_SOUND_URI);
  const [showAllGroups, setShowAllGroups] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setSleepNow(Date.now());
    }, 1000);

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

  const nowPlayingDetails = useMemo(
    () => ({
      emoji: selectedTrack.emoji,
      title: selectedTrack.name,
      subtitle: selectedTrack.description,
    }),
    [selectedTrack]
  );

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
          detail:
            sleepCircle.action === 'alarm'
              ? 'Alarm standing by for your next session'
              : 'Awaiting your next session',
        };
      }

      const minutes = ceilingMinutesFromMs(remainingMs);
      const detailPrefix = sleepCircle.action === 'alarm' ? 'Alarm in' : 'Stops in';
      return {
        headline: `Timer · ${formatDurationCompact(minutes)}`,
        detail: `${detailPrefix} ${formatDurationLong(minutes)}`,
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

  const sleepProgress = useMemo(() => {
    if (!sleepCircle) {
      return null;
    }

    if (sleepCircle.mode === 'timer') {
      const totalDurationMs = sleepCircle.duration * 60000;

      if (totalDurationMs <= 0) {
        return 1;
      }

      const remainingMs = sleepCircle.targetTimestamp - sleepNow;
      const clampedRemaining = Math.min(Math.max(remainingMs, 0), totalDurationMs);
      const elapsed = totalDurationMs - clampedRemaining;
      return Math.min(Math.max(elapsed / totalDurationMs, 0), 1);
    }

    const totalAlarmMs = sleepCircle.fireTimestamp - sleepCircle.scheduledAt;

    if (totalAlarmMs <= 0) {
      return 1;
    }

    const elapsed = Math.min(
      Math.max(sleepNow - sleepCircle.scheduledAt, 0),
      totalAlarmMs
    );
    return Math.min(Math.max(elapsed / totalAlarmMs, 0), 1);
  }, [sleepCircle, sleepNow]);

  const handleSleepComplete = useCallback(
    async (state: Exclude<SleepCircleState, null>) => {
      setSleepCircle(null);
      Vibration.vibrate([0, 400, 200, 400], false);

      pauseAmbient();

      const shouldPlayAlarm =
        state.mode === 'alarm' || (state.mode === 'timer' && state.action === 'alarm');

      if (shouldPlayAlarm) {
        try {
          alarmPlayer.seekTo(0);
          alarmPlayer.play();
        } catch (error) {
          console.warn('Alarm playback failed', error);
        }
      }

      const title = shouldPlayAlarm ? 'Alarm ringing' : 'Timer finished';
      const message = shouldPlayAlarm
        ? 'Time to wake up! Your Dream Capsule alarm is sounding.'
        : 'Playback faded out with the Dream Capsule timer.';

      Alert.alert(title, message, [
        shouldPlayAlarm
          ? {
              text: 'Stop alarm',
              onPress: () => {
                try {
                  alarmPlayer.pause();
                  alarmPlayer.seekTo(0);
                } catch (error) {
                  console.warn('Alarm pause failed', error);
                }
              },
            }
          : { text: 'OK' },
      ]);
    },
    [alarmPlayer, pauseAmbient]
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

      const capturedState = state;
      sleepTimeoutRef.current = setTimeout(() => {
        handleSleepComplete(capturedState);
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
      setSleepTimerAction(sleepCircle.action);
    } else if (sleepCircle?.mode === 'alarm') {
      setSleepMode('alarm');
      setAlarmHour(sleepCircle.hour);
      setAlarmMinute(sleepCircle.minute);
      setAlarmPeriod(sleepCircle.period);
    } else {
      setSleepMode('timer');
      setSleepTimerMinutes((previous) => clampTimerMinutes(previous));
      setSleepTimerAction('stop');
    }
    setSleepModalOpen(true);
  }, [sleepCircle]);

  const handleApplySleepCircle = useCallback(() => {
    if (sleepMode === 'timer') {
      const minutes = clampTimerMinutes(sleepTimerMinutes);
      const startedAt = Date.now();
      const targetTimestamp = startedAt + minutes * 60000;
      setSleepCircle({
        mode: 'timer',
        duration: minutes,
        targetTimestamp,
        startedAt,
        action: sleepTimerAction,
      });
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
        scheduledAt: now.getTime(),
      });
    }
    setSleepModalOpen(false);
  }, [alarmHour, alarmMinute, alarmPeriod, sleepMode, sleepTimerAction, sleepTimerMinutes]);

  const handleClearSleepCircle = useCallback(() => {
    setSleepCircle(null);
    setSleepTimerAction('stop');
    setSleepModalOpen(false);
  }, []);

  const handleToggleMusicTheme = useCallback(() => {
    setMusicColorScheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const handleSelectTrack = useCallback(
    (trackId: MusicOption['id']) => {
      selectTrack(trackId, { autoPlay: true });
    },
    [selectTrack]
  );

  const handleSelectPrevious = useCallback(() => {
    if (MUSIC_OPTIONS.length === 0) {
      return;
    }

    const currentIndex = MUSIC_OPTIONS.findIndex((option) => option.id === selectedTrackId);
    const safeIndex = currentIndex >= 0 ? currentIndex : 0;
    const previousIndex = (safeIndex - 1 + MUSIC_OPTIONS.length) % MUSIC_OPTIONS.length;
    const previousTrack = MUSIC_OPTIONS[previousIndex];

    if (previousTrack && previousTrack.id !== selectedTrackId) {
      selectTrack(previousTrack.id, { autoPlay: isAmbientPlaying });
    }
  }, [isAmbientPlaying, selectTrack, selectedTrackId]);

  const handleSelectNext = useCallback(() => {
    if (MUSIC_OPTIONS.length === 0) {
      return;
    }

    const currentIndex = MUSIC_OPTIONS.findIndex((option) => option.id === selectedTrackId);
    const safeIndex = currentIndex >= 0 ? currentIndex : 0;
    const nextIndex = (safeIndex + 1) % MUSIC_OPTIONS.length;
    const nextTrack = MUSIC_OPTIONS[nextIndex];

    if (nextTrack && nextTrack.id !== selectedTrackId) {
      selectTrack(nextTrack.id, { autoPlay: isAmbientPlaying });
    }
  }, [isAmbientPlaying, selectTrack, selectedTrackId]);

  const handleToggleAmbientPlayback = useCallback(() => {
    togglePlayback();
  }, [togglePlayback]);

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
              {isAmbientPlaying ? (
                <AudioOrb emoji={nowPlayingDetails.emoji} palette={palette} styles={styles} />
              ) : (
                <View style={styles.nowPlayingEmojiStatic}>
                  <Text style={styles.nowPlayingEmoji}>{nowPlayingDetails.emoji}</Text>
                </View>
              )}
            </View>
            <View style={styles.nowPlayingBody}>
              <Text style={styles.nowPlayingTitle}>{nowPlayingDetails.title}</Text>
              <Text style={styles.nowPlayingSubtitle}>{nowPlayingDetails.subtitle}</Text>
            </View>
          </View>
          <View style={styles.sleepStatusBlock}>
            <Text style={styles.sleepStatusLabel}>Dream Capsule</Text>
            <Text style={styles.sleepStatusBlockHeadline}>{sleepSummary.detail}</Text>
            {ambientError ? (
              <Text style={styles.sleepStatusWarning}>
                Ambient mix playback is unavailable. Try another sound or reconnect audio.
              </Text>
            ) : null}
          </View>
          <View style={styles.nowPlayingControls}>
            <Pressable
              onPress={handleSelectPrevious}
              style={({ pressed }) => [
                styles.nowPlayingControlButton,
                pressed && styles.nowPlayingControlButtonActive,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Play previous ambience"
              accessibilityHint="Loads the previous ambience in the list"
              hitSlop={10}
            >
              {({ pressed }) => (
                <Feather
                  name="skip-back"
                  size={24}
                  color={pressed ? palette.nowPlayingControlIconActive : palette.nowPlayingControlIcon}
                />
              )}
            </Pressable>
            <Pressable
              onPress={handleToggleAmbientPlayback}
              style={({ pressed }) => [
                styles.nowPlayingControlButton,
                styles.nowPlayingControlButtonPrimary,
                (isAmbientPlaying || pressed) && styles.nowPlayingControlButtonActive,
                (isAmbientPlaying || pressed) && styles.nowPlayingControlButtonPrimaryActive,
              ]}
              accessibilityRole="button"
              accessibilityLabel={isAmbientPlaying ? 'Pause ambience' : 'Play ambience'}
              accessibilityHint={
                isAmbientPlaying
                  ? 'Pauses the currently playing ambience'
                  : 'Starts the selected ambience mix'
              }
              hitSlop={12}
            >
              {({ pressed }) => (
                <View style={styles.nowPlayingPrimaryIconWrap}>
                  <Feather
                    name={isAmbientPlaying ? 'pause' : 'play'}
                    size={isAmbientPlaying ? 30 : 32}
                    style={!isAmbientPlaying ? styles.nowPlayingPlayIcon : undefined}
                    color={
                      isAmbientPlaying || pressed
                        ? palette.nowPlayingControlIconActive
                        : palette.nowPlayingControlIcon
                    }
                  />
                </View>
              )}
            </Pressable>
            <Pressable
              onPress={handleSelectNext}
              style={({ pressed }) => [
                styles.nowPlayingControlButton,
                pressed && styles.nowPlayingControlButtonActive,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Play next ambience"
              accessibilityHint="Loads the next ambience in the list"
              hitSlop={10}
            >
              {({ pressed }) => (
                <Feather
                  name="skip-forward"
                  size={24}
                  color={pressed ? palette.nowPlayingControlIconActive : palette.nowPlayingControlIcon}
                />
              )}
            </Pressable>
          </View>
          {sleepProgress !== null ? (
            <View
              style={styles.sleepProgressWrapper}
              accessible
              accessibilityRole="progressbar"
              accessibilityLabel="Dream Capsule timer progress"
              accessibilityValue={{
                min: 0,
                max: 100,
                now: Math.round(sleepProgress * 100),
              }}
            >
              <View style={styles.sleepProgressTrack}>
                <View
                  style={[
                    styles.sleepProgressFill,
                    { width: `${Math.min(Math.max(sleepProgress, 0), 1) * 100}%` },
                  ]}
                />
              </View>
            </View>
          ) : null}
        </View>

        {primaryGroups.map((group) => (
          <View key={group.id} style={styles.groupSection}>
            <Text style={styles.groupTitle}>{group.label}</Text>
            <Text style={styles.groupDescription}>{group.intro}</Text>
            <View style={styles.optionList}>
              {group.options.map((option) => {
                const isSelected = option.id === selectedTrackId;
                const isPlayingOption = isSelected && isAmbientPlaying;
                return (
                  <Pressable
                    key={option.id}
                    style={[styles.optionRow, isSelected && styles.optionRowActive]}
                    onPress={() => handleSelectTrack(option.id)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                  >
                    <View style={styles.optionAvatar}>
                      {isPlayingOption ? (
                        <AudioOrb emoji={option.emoji} palette={palette} styles={styles} />
                      ) : (
                        <View
                          style={[
                            styles.optionEmojiWrap,
                            isSelected && styles.optionEmojiWrapActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.optionEmoji,
                              isSelected && styles.optionEmojiActive,
                            ]}
                          >
                            {option.emoji}
                          </Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.optionBody}>
                      <Text style={[styles.optionName, isSelected && styles.optionNameActive]}>
                        {option.name}
                      </Text>
                      <Text style={styles.optionDescription}>{option.description}</Text>
                    </View>
                    {isPlayingOption ? <Text style={styles.optionBadge}>Playing</Text> : null}
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
                        const isSelected = option.id === selectedTrackId;
                        const isPlayingOption = isSelected && isAmbientPlaying;
                        return (
                          <Pressable
                            key={option.id}
                            style={[styles.optionRow, isSelected && styles.optionRowActive]}
                            onPress={() => handleSelectTrack(option.id)}
                            accessibilityRole="button"
                            accessibilityState={{ selected: isSelected }}
                          >
                            <View style={styles.optionAvatar}>
                              {isPlayingOption ? (
                                <AudioOrb emoji={option.emoji} palette={palette} styles={styles} />
                              ) : (
                                <View
                                  style={[
                                    styles.optionEmojiWrap,
                                    isSelected && styles.optionEmojiWrapActive,
                                  ]}
                                >
                                  <Text
                                    style={[
                                      styles.optionEmoji,
                                      isSelected && styles.optionEmojiActive,
                                    ]}
                                  >
                                    {option.emoji}
                                  </Text>
                                </View>
                              )}
                            </View>
                            <View style={styles.optionBody}>
                              <Text style={[styles.optionName, isSelected && styles.optionNameActive]}>
                                {option.name}
                              </Text>
                              <Text style={styles.optionDescription}>{option.description}</Text>
                            </View>
                            {isPlayingOption ? <Text style={styles.optionBadge}>Playing</Text> : null}
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
          <View style={styles.sleepCard}>
            <View pointerEvents="none" style={styles.sleepCardGlow} />
            <View style={styles.sleepHeaderRow}>
              <View style={styles.sleepHeaderBadge}>
                <Text style={styles.sleepHeaderEmoji}>🌙</Text>
              </View>
              <View style={styles.sleepHeaderText}>
                <Text style={styles.sleepTitle}>Dream Capsule</Text>
                <Text style={styles.sleepDescription}>
                  Set a fade-out timer or schedule a wake alarm—your Dream Capsule feels at home in light or
                  dark mode.
                </Text>
              </View>
            </View>
            <ScrollView
              style={styles.sleepCardScroll}
              contentContainerStyle={[styles.sleepContent, { paddingBottom: insets.bottom + 16 }]}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              <View style={styles.sleepColumns}>
                <View style={[styles.sleepColumn, styles.sleepColumnPrimary]}>
                  <Text style={styles.sleepSectionLabel}>Mode</Text>
                  <View style={styles.sleepModeList}>
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
                  {sleepMode === 'timer' ? (
                    <>
                      <Text style={styles.sleepSectionLabel}>Timer actions</Text>
                      <View style={styles.timerActionList}>
                        {TIMER_ACTION_OPTIONS.map((option) => {
                          const isActive = sleepTimerAction === option.id;
                          return (
                            <Pressable
                              key={option.id}
                              style={[styles.timerActionCard, isActive && styles.timerActionCardActive]}
                              onPress={() => setSleepTimerAction(option.id)}
                              accessibilityRole="button"
                              accessibilityState={{ selected: isActive }}
                            >
                              <Text
                                style={[styles.timerActionLabel, isActive && styles.timerActionLabelActive]}
                              >
                                {option.title}
                              </Text>
                              <Text style={styles.timerActionDescription}>{option.description}</Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    </>
                  ) : (
                    <View style={styles.sleepStatusPanel}>
                      <Text style={styles.sleepStatusHeadline}>{sleepSummary.headline}</Text>
                      <Text style={styles.sleepStatusCopy}>{sleepSummary.detail}</Text>
                    </View>
                  )}
                </View>
                <View style={[styles.sleepColumn, styles.sleepColumnSecondary]}>
                  <Text style={styles.sleepSectionLabel}>
                    {sleepMode === 'timer' ? 'Timer length' : 'Wake time'}
                  </Text>
                  {sleepMode === 'timer' ? (
                    <>
                      <View style={styles.sleepTimerReadoutCard}>
                        <Text style={styles.sleepTimerReadoutValue}>
                          {formatDurationLong(sleepTimerMinutes)}
                        </Text>
                        <Text style={styles.sleepTimerReadoutHint}>Timer duration</Text>
                      </View>
                      <View style={styles.sleepTimerWheelRow}>
                        <WheelPicker
                          data={TIMER_MINUTE_OPTIONS}
                          value={clampTimerMinutes(sleepTimerMinutes)}
                          onChange={setSleepTimerMinutes}
                          formatter={(value) => `${value} min`}
                          label="Timer length"
                          styles={styles}
                        />
                      </View>
                    </>
                  ) : (
                    <>
                      <View style={styles.alarmSummaryCard}>
                        <Text style={styles.alarmSummaryLabel}>Next wake chime</Text>
                        <Text style={styles.alarmSummaryValue}>
                          {formatAlarmDisplay(alarmHour, alarmMinute, alarmPeriod)}
                        </Text>
                      </View>
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
                    </>
                  )}
                </View>
              </View>
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
            </ScrollView>
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





