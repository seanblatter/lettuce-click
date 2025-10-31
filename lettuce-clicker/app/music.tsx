import { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

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
  { id: 'white', label: 'White Noise', intro: 'Bright, energetic mixes to keep the garden lively.' },
  { id: 'grey', label: 'Grey Noise', intro: 'Softly balanced sounds that settle the senses.' },
  { id: 'rain', label: 'Rainfall Retreats', intro: 'Falling drops and distant thunder for gentle nights.' },
  { id: 'ocean', label: 'Ocean Drift', intro: 'Coastal hush and tidal sways for breezy focus.' },
  { id: 'forest', label: 'Forest Echoes', intro: 'Leaves, birds, and twilight breezes between the vines.' },
  { id: 'static', label: 'Static & Signal', intro: 'Analog textures tuned for deep concentration.' },
  { id: 'keys', label: 'Keys & Chords', intro: 'Piano and plucked harmonies to soften the mood.' },
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
  { id: 'timer', label: 'Sleep timer', description: 'Fade out and stop playback when the time ends.' },
  { id: 'alarm', label: 'Wake alarm', description: 'Play gentle chimes when the timer finishes.' },
] as const;

const SLEEP_TIMER_PRESETS = [
  { id: '15', label: '15 min', minutes: 15 },
  { id: '30', label: '30 min', minutes: 30 },
  { id: '45', label: '45 min', minutes: 45 },
  { id: '60', label: '60 min', minutes: 60 },
  { id: '90', label: '90 min', minutes: 90 },
  { id: '120', label: '120 min', minutes: 120 },
] as const;

type MusicOption = (typeof MUSIC_OPTIONS)[number];
type MusicServiceId = (typeof MUSIC_SERVICES)[number]['id'];
type MusicSource = 'mix' | MusicServiceId;
type SleepMode = (typeof SLEEP_MODE_OPTIONS)[number]['id'];
type SleepCircleState = { mode: SleepMode; minutes: number } | null;

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
  const [sleepDuration, setSleepDuration] = useState<number>(30);
  const [sleepCircle, setSleepCircle] = useState<SleepCircleState>(null);

  const groupedOptions = useMemo(
    () =>
      MUSIC_GROUPS.map((group) => ({
        ...group,
        options: MUSIC_OPTIONS.filter((option) => option.family === group.id),
      })),
    []
  );

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
      return 'Sleep circle off';
    }

    const suffix = sleepCircle.minutes === 1 ? 'minute' : 'minutes';
    if (sleepCircle.mode === 'timer') {
      return `Sleep circle: stops in ${sleepCircle.minutes} ${suffix}`;
    }
    return `Sleep circle: alarm in ${sleepCircle.minutes} ${suffix}`;
  }, [sleepCircle]);

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

  const handleOpenSleepModal = useCallback(() => {
    if (sleepCircle) {
      setSleepMode(sleepCircle.mode);
      setSleepDuration(sleepCircle.minutes);
    }
    setSleepModalOpen(true);
  }, [sleepCircle]);

  const handleApplySleepCircle = useCallback(() => {
    setSleepCircle({ mode: sleepMode, minutes: sleepDuration });
    setSleepModalOpen(false);
  }, [sleepDuration, sleepMode]);

  const handleClearSleepCircle = useCallback(() => {
    if (sleepCircle) {
      setSleepCircle(null);
    }
    setSleepModalOpen(false);
  }, [sleepCircle]);

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
            <Text style={styles.headerSubtitle}>Your day &amp; night oasis for ambient focus.</Text>
          </View>
          <Pressable
            onPress={handleOpenSleepModal}
            style={styles.sleepButton}
            accessibilityRole="button"
            accessibilityLabel="Open sleep circle timer"
          >
            <Text style={styles.sleepButtonIcon}>🌙</Text>
            <Text style={styles.sleepButtonLabel}>Sleep</Text>
          </Pressable>
        </View>

        <View style={styles.nowPlayingCard}>
          <View style={styles.nowPlayingHeader}>
            <Text style={styles.nowPlayingLabel}>Now playing</Text>
            <Text style={styles.nowPlayingStatus}>{sleepSummary}</Text>
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

        {groupedOptions.map((group) => (
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
            <Text style={styles.sleepTitle}>Sleep circle</Text>
            <Text style={styles.sleepDescription}>
              Set a timer to fade out white noise or a wake alarm for a gentle morning.
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
              {sleepMode === 'timer' ? 'Timer length' : 'Alarm delay'}
            </Text>
            <View style={styles.sleepTimerGrid}>
              {SLEEP_TIMER_PRESETS.map((preset) => {
                const isActive = sleepDuration === preset.minutes;
                return (
                  <Pressable
                    key={preset.id}
                    style={[styles.sleepTimerButton, isActive && styles.sleepTimerButtonActive]}
                    onPress={() => setSleepDuration(preset.minutes)}
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
            <Text style={styles.sleepActiveSummary}>
              {sleepMode === 'timer'
                ? `Playback will end after ${sleepDuration} minutes.`
                : `A gentle alarm will play after ${sleepDuration} minutes.`}
            </Text>
            <View style={styles.sleepActions}>
              <Pressable
                style={styles.sleepClearButton}
                onPress={handleClearSleepCircle}
                accessibilityRole="button"
              >
                <Text style={styles.sleepClearButtonText}>
                  {sleepCircle ? 'Clear circle' : 'Cancel'}
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f2f9f2',
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 48,
    gap: 28,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerBackButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(22, 101, 52, 0.14)',
    alignItems: 'center',
    minWidth: 72,
  },
  headerBackText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#14532d',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#134e32',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: '#166534',
    textAlign: 'center',
  },
  sleepButton: {
    minWidth: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#134e32',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 4,
    shadowColor: '#0f172a',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  sleepButtonIcon: {
    fontSize: 24,
  },
  sleepButtonLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#f7fee7',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  nowPlayingCard: {
    backgroundColor: '#ecfdf5',
    borderRadius: 26,
    padding: 22,
    gap: 16,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    shadowColor: '#0f172a',
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  nowPlayingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nowPlayingLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#047857',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  nowPlayingStatus: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0f5132',
  },
  nowPlayingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  nowPlayingEmojiWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#bbf7d0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nowPlayingEmoji: {
    fontSize: 32,
  },
  nowPlayingBody: {
    flex: 1,
    gap: 4,
  },
  nowPlayingTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#134e32',
  },
  nowPlayingSubtitle: {
    fontSize: 13,
    color: '#1f2937',
    lineHeight: 18,
  },
  nowPlayingSources: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  sourcePill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.45)',
    backgroundColor: '#f0fdf4',
  },
  sourcePillActive: {
    backgroundColor: '#047857',
    borderColor: '#047857',
    shadowColor: '#047857',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  sourcePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#047857',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  sourcePillTextActive: {
    color: '#ecfdf5',
  },
  serviceSection: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#14532d',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#1f2937',
    lineHeight: 18,
  },
  serviceList: {
    gap: 12,
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(20, 83, 45, 0.12)',
    shadowColor: '#0f172a',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  serviceCardConnected: {
    borderColor: '#10b981',
    backgroundColor: '#ecfdf5',
    shadowColor: '#10b981',
    shadowOpacity: 0.18,
  },
  serviceIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceIconWrapConnected: {
    backgroundColor: '#bbf7d0',
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
    color: '#134e32',
  },
  serviceNameConnected: {
    color: '#047857',
  },
  serviceDescription: {
    fontSize: 13,
    color: '#1f2937',
    lineHeight: 18,
  },
  serviceStatus: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0f5132',
  },
  serviceStatusConnected: {
    color: '#047857',
  },
  groupSection: {
    gap: 12,
  },
  groupTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#14532d',
  },
  groupDescription: {
    fontSize: 13,
    color: '#1f2937',
  },
  optionList: {
    gap: 12,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(20, 83, 45, 0.12)',
    shadowColor: '#0f172a',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  optionRowActive: {
    borderColor: '#10b981',
    shadowColor: '#10b981',
    shadowOpacity: 0.22,
  },
  optionEmojiWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionEmojiWrapActive: {
    backgroundColor: '#bbf7d0',
  },
  optionEmoji: {
    fontSize: 28,
  },
  optionEmojiActive: {
    transform: [{ scale: 1.08 }],
  },
  optionBody: {
    flex: 1,
    gap: 2,
  },
  optionName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#134e32',
  },
  optionNameActive: {
    color: '#0f766e',
  },
  optionDescription: {
    fontSize: 13,
    lineHeight: 18,
    color: '#1f2937',
  },
  optionBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#047857',
  },
  sleepOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 31, 23, 0.55)',
    justifyContent: 'flex-end',
  },
  sleepBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sleepCard: {
    backgroundColor: '#f8fffb',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 18,
    gap: 18,
  },
  sleepHandle: {
    alignSelf: 'center',
    width: 48,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#bbf7d0',
  },
  sleepTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#134e32',
    textAlign: 'center',
  },
  sleepDescription: {
    fontSize: 13,
    color: '#166534',
    lineHeight: 18,
    textAlign: 'center',
  },
  sleepModeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  sleepModeButton: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    backgroundColor: '#f0fdf4',
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 6,
  },
  sleepModeButtonActive: {
    backgroundColor: '#047857',
    borderColor: '#047857',
    shadowColor: '#047857',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  sleepModeLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#047857',
  },
  sleepModeLabelActive: {
    color: '#ecfdf5',
  },
  sleepModeDescription: {
    fontSize: 12,
    color: '#166534',
    lineHeight: 16,
  },
  sleepSectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#14532d',
  },
  sleepTimerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  sleepTimerButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(20, 83, 45, 0.2)',
    backgroundColor: '#ffffff',
  },
  sleepTimerButtonActive: {
    backgroundColor: '#10b981',
    borderColor: '#0f766e',
  },
  sleepTimerText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#14532d',
  },
  sleepTimerTextActive: {
    color: '#ecfdf5',
  },
  sleepActiveSummary: {
    fontSize: 13,
    color: '#166534',
    textAlign: 'center',
  },
  sleepActions: {
    flexDirection: 'row',
    gap: 12,
  },
  sleepClearButton: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  sleepClearButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#14532d',
  },
  sleepApplyButton: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#047857',
    shadowColor: '#047857',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  sleepApplyButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ecfdf5',
  },
});
