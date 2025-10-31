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
  View,
  Vibration,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
// eslint-disable-next-line import/no-unresolved
import { Audio } from 'expo-av';
import { ALARM_CHIME_DATA_URI } from '@/assets/audio/alarmChime';

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
  const sleepTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const alarmSoundRef = useRef<Audio.Sound | null>(null);
  const [audioReady, setAudioReady] = useState(false);
  const [audioError, setAudioError] = useState<Error | null>(null);
  const [showAllGroups, setShowAllGroups] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setSleepNow(Date.now());
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, staysActiveInBackground: false });
        const { sound } = await Audio.Sound.createAsync(
          { uri: ALARM_SOUND_URI },
          { shouldPlay: false, volume: 1 },
        );

        if (cancelled) {
          await sound.unloadAsync();
          return;
        }

        alarmSoundRef.current = sound;
        setAudioReady(true);
      } catch (error) {
        if (!cancelled) {
          setAudioError(error instanceof Error ? error : new Error('Failed to prepare alarm sound'));
        }
      }
    })();

    return () => {
      cancelled = true;

      if (sleepTimeoutRef.current) {
        clearTimeout(sleepTimeoutRef.current);
        sleepTimeoutRef.current = null;
      }

      const sound = alarmSoundRef.current;
      if (sound) {
        sound.unloadAsync().catch(() => {});
        alarmSoundRef.current = null;
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

  const handleSelectTrack = useCallback((trackId: MusicOption['id']) => {
    setSelectedTrackId(trackId);
    setNowPlayingSource('mix');
  }, []);

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
        const sound = alarmSoundRef.current;
        if (mode === 'alarm' && sound) {
          await sound.replayAsync();
        } else if (mode === 'alarm' && audioError) {
          console.warn('Alarm sound unavailable', audioError);
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
    [audioError]
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
            <Text style={styles.headerTitle}>🥬 Music Lounge</Text>
            <Text style={styles.headerSubtitle}>Curated ambience for focus &amp; rest.</Text>
          </View>
          <Pressable
            onPress={handleOpenSleepModal}
            style={styles.sleepButton}
            accessibilityRole="button"
            accessibilityLabel="Open Dream Capsule controls"
            accessibilityHint="Set timers or wake alarms"
            accessibilityValue={{ text: sleepSummary.headline }}
          >
            <View style={styles.sleepGlyphBubble}>
              <Text style={styles.sleepGlyph}>🌙</Text>
            </View>
            <View style={styles.sleepGlyphBubble}>
              <Text style={styles.sleepGlyph}>⏰</Text>
            </View>
          </Pressable>
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
          <View style={styles.nowPlayingSources}>
            {availableSources.map((source) => {
              const isActive = nowPlayingSource === source.id;
              return (
                <Pressable
                  key={source.id}
                  style={[styles.sourcePill, isActive && styles.sourcePillActive]}
                  onPress={() => setNowPlayingSource(source.id)}
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
                        const isActive = option.id === selectedTrackId && nowPlayingSource === 'mix';
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
              Set a fade-out timer or schedule a wake alarm with a soft lettuce chime.
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
                />
                <Text style={styles.alarmPickerSeparator}>:</Text>
                <WheelPicker
                  data={ALARM_MINUTE_OPTIONS}
                  value={alarmMinute}
                  onChange={setAlarmMinute}
                  formatter={(value) => value.toString().padStart(2, '0')}
                  label="Alarm minute"
                />
                <WheelPicker
                  data={ALARM_PERIOD_OPTIONS}
                  value={alarmPeriod}
                  onChange={setAlarmPeriod}
                  label="AM or PM"
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

type WheelPickerProps<T extends WheelValue> = {
  data: readonly T[];
  value: T;
  onChange: (value: T) => void;
  formatter?: (value: T) => string;
  label?: string;
};

function WheelPicker<T extends WheelValue>({
  data,
  value,
  onChange,
  formatter,
  label = 'Alarm time selector',
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
        contentOffset={{ y: initialIndex * WHEEL_ITEM_HEIGHT }}
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#04120c',
  },
  scroll: {
    flex: 1,
    backgroundColor: '#04120c',
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
    backgroundColor: 'rgba(77, 255, 166, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(77, 255, 166, 0.35)',
  },
  headerBackText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#86f3c1',
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
    color: '#f6fff6',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: '#9edfb6',
    textAlign: 'center',
  },
  sleepButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(18, 61, 39, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(77, 255, 166, 0.32)',
    shadowColor: '#03140d',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  sleepGlyphBubble: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(77, 255, 166, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(77, 255, 166, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sleepGlyph: {
    fontSize: 22,
  },
  nowPlayingCard: {
    backgroundColor: 'rgba(10, 34, 24, 0.92)',
    borderRadius: 28,
    padding: 24,
    gap: 18,
    borderWidth: 1,
    borderColor: 'rgba(77, 255, 166, 0.25)',
    shadowColor: '#021008',
    shadowOpacity: 0.45,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 18 },
    elevation: 8,
  },
  nowPlayingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nowPlayingLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#74f0ba',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  nowPlayingMeta: {
    fontSize: 12,
    fontWeight: '600',
    color: '#caffd6',
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
    backgroundColor: 'rgba(77, 255, 166, 0.22)',
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
    color: '#f6fff6',
  },
  nowPlayingSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: '#9cbda9',
  },
  sleepStatusBlock: {
    gap: 4,
    padding: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(8, 30, 21, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(77, 255, 166, 0.18)',
  },
  sleepStatusLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6ee7b7',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  sleepStatusHeadline: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e7fff2',
  },
  sleepStatusWarning: {
    fontSize: 12,
    color: '#fcd34d',
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
    borderColor: 'rgba(77, 255, 166, 0.3)',
    backgroundColor: 'rgba(7, 28, 19, 0.9)',
  },
  sourcePillActive: {
    backgroundColor: '#2dd78f',
    borderColor: '#2dd78f',
    shadowColor: '#2dd78f',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  sourcePillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#caffd6',
  },
  sourcePillTextActive: {
    color: '#062014',
  },
  serviceSection: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#e7fff2',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#94b8a4',
    lineHeight: 19,
  },
  serviceList: {
    gap: 12,
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: 'rgba(8, 26, 18, 0.9)',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(77, 255, 166, 0.14)',
  },
  serviceCardConnected: {
    borderColor: 'rgba(77, 255, 166, 0.4)',
    backgroundColor: 'rgba(9, 36, 24, 0.95)',
  },
  serviceIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(77, 255, 166, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceIconWrapConnected: {
    backgroundColor: 'rgba(77, 255, 166, 0.28)',
  },
  serviceIcon: {
    fontSize: 28,
  },
  serviceBody: {
    flex: 1,
    gap: 4,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ecfff6',
  },
  serviceNameConnected: {
    color: '#86f3c1',
  },
  serviceDescription: {
    fontSize: 13,
    color: '#92af9f',
    lineHeight: 18,
  },
  serviceStatus: {
    fontSize: 12,
    fontWeight: '600',
    color: '#82cfa6',
  },
  serviceStatusConnected: {
    color: '#46f09d',
  },
  groupSection: {
    gap: 14,
  },
  groupToggle: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(8, 26, 18, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(77, 255, 166, 0.28)',
  },
  groupToggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6ee7b7',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  secondaryGroup: {
    gap: 14,
  },
  groupTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f7fff9',
  },
  groupDescription: {
    fontSize: 13,
    color: '#9cbda9',
  },
  optionList: {
    gap: 12,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: 'rgba(9, 26, 18, 0.92)',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(77, 255, 166, 0.18)',
    shadowColor: '#021007',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  optionRowActive: {
    borderColor: '#2dd78f',
    shadowColor: '#2dd78f',
    shadowOpacity: 0.45,
  },
  optionEmojiWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(77, 255, 166, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionEmojiWrapActive: {
    backgroundColor: 'rgba(77, 255, 166, 0.28)',
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
    color: '#f6fff6',
  },
  optionNameActive: {
    color: '#86f3c1',
  },
  optionDescription: {
    fontSize: 12,
    lineHeight: 17,
    color: '#97b2a4',
  },
  optionBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6ee7b7',
  },
  sleepOverlay: {
    flex: 1,
    backgroundColor: 'rgba(4, 12, 8, 0.82)',
    justifyContent: 'flex-end',
  },
  sleepBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sleepCard: {
    backgroundColor: 'rgba(3, 16, 10, 0.98)',
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
    backgroundColor: 'rgba(77, 255, 166, 0.28)',
  },
  sleepTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#f6fff6',
    textAlign: 'center',
  },
  sleepDescription: {
    fontSize: 13,
    color: '#8fb59f',
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
    borderColor: 'rgba(77, 255, 166, 0.14)',
    paddingVertical: 16,
    paddingHorizontal: 14,
    gap: 6,
    backgroundColor: 'rgba(7, 24, 16, 0.9)',
  },
  sleepModeButtonActive: {
    backgroundColor: 'rgba(18, 60, 39, 0.95)',
    borderColor: '#2dd78f',
  },
  sleepModeLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8fb59f',
  },
  sleepModeLabelActive: {
    color: '#f6fff6',
  },
  sleepModeDescription: {
    fontSize: 12,
    color: '#6f8d7c',
    lineHeight: 16,
  },
  sleepSectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6ee7b7',
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
    borderColor: 'rgba(77, 255, 166, 0.18)',
    backgroundColor: 'rgba(7, 24, 16, 0.9)',
  },
  sleepTimerButtonActive: {
    backgroundColor: 'rgba(18, 60, 39, 0.95)',
    borderColor: '#2dd78f',
  },
  sleepTimerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#caffd6',
  },
  sleepTimerTextActive: {
    color: '#062014',
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
    color: '#6ee7b7',
  },
  sleepActiveSummary: {
    gap: 4,
    alignItems: 'center',
  },
  sleepActiveHeadline: {
    fontSize: 14,
    fontWeight: '700',
    color: '#caffd6',
  },
  sleepActiveDetail: {
    fontSize: 12,
    color: '#8fb59f',
  },
  sleepActions: {
    flexDirection: 'row',
    gap: 14,
  },
  sleepClearButton: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(77, 255, 166, 0.28)',
    alignItems: 'center',
    paddingVertical: 14,
  },
  sleepClearButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#86f3c1',
  },
  sleepApplyButton: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: '#2dd78f',
    alignItems: 'center',
    paddingVertical: 14,
    shadowColor: '#2dd78f',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  sleepApplyButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#04120c',
  },
  wheelPickerContainer: {
    height: WHEEL_CONTAINER_HEIGHT,
    width: 64,
    borderRadius: 18,
    backgroundColor: 'rgba(7, 24, 16, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(77, 255, 166, 0.18)',
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
    borderColor: 'rgba(77, 255, 166, 0.35)',
    backgroundColor: 'rgba(18, 60, 39, 0.35)',
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
    color: '#6f8d7c',
  },
  wheelPickerTextActive: {
    color: '#f6fff6',
  },
});

