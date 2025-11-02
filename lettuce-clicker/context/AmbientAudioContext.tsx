
import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Audio } from 'expo-av';

import { MUSIC_AUDIO_MAP, MUSIC_OPTIONS, type MusicOption } from '@/constants/music';

type SleepAlertTone = 'timer' | 'alarm';

type SleepAlertState = {
  tone: SleepAlertTone;
  title: string;
  message: string;
  onDismiss?: () => void;
};

type AmbientAudioContextValue = {
  selectedTrackId: MusicOption['id'];
  isPlaying: boolean;
  error: Error | null;
  selectTrack: (trackId: MusicOption['id']) => void;
  togglePlayback: () => void;
  play: () => void;
  pause: () => void;
  sleepAlert: SleepAlertState | null;
  showSleepAlert: (alert: SleepAlertState) => void;
  dismissSleepAlert: () => void;
};

const AmbientAudioContext = createContext<AmbientAudioContextValue | undefined>(undefined);

type ProviderProps = {
  children: ReactNode;
};

export function AmbientAudioProvider({ children }: ProviderProps) {
  const [selectedTrackId, setSelectedTrackId] = useState<MusicOption['id']>(MUSIC_OPTIONS[0].id);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [sleepAlert, setSleepAlert] = useState<SleepAlertState | null>(null);
  const isPlayingRef = useRef(isPlaying);
  const trackRef = useRef(selectedTrackId);
  const soundRef = useRef<Audio.Sound | null>(null);
  const loadedTrackRef = useRef<MusicOption['id'] | null>(null);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    trackRef.current = selectedTrackId;
  }, [selectedTrackId]);

  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
      interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
      shouldDuckAndroid: false,
    }).catch((caught) => {
      console.warn('Unable to configure audio mode', caught);
    });
  }, []);

  const unloadCurrentSound = useCallback(async () => {
    if (!soundRef.current) {
      return;
    }

    try {
      await soundRef.current.stopAsync();
    } catch (caught) {
      console.warn('Failed to stop ambient audio', caught);
    }

    try {
      await soundRef.current.unloadAsync();
    } catch (caught) {
      console.warn('Failed to unload ambient audio', caught);
    }

    soundRef.current = null;
    loadedTrackRef.current = null;
  }, []);

  const ensureSound = useCallback(
    async (trackId: MusicOption['id']) => {
      const source = MUSIC_AUDIO_MAP[trackId];
      if (!source) {
        return { sound: null as Audio.Sound | null, isNew: false };
      }

      if (loadedTrackRef.current === trackId && soundRef.current) {
        return { sound: soundRef.current, isNew: false };
      }

      await unloadCurrentSound();

      try {
        const { sound } = await Audio.Sound.createAsync(source, {
          shouldPlay: false,
          isLooping: true,
          volume: 1,
        });

        soundRef.current = sound;
        loadedTrackRef.current = trackId;
        return { sound, isNew: true };
      } catch (caught) {
        throw caught instanceof Error ? caught : new Error('Failed to load ambient audio');
      }
    },
    [unloadCurrentSound]
  );

  const applyPlaybackState = useCallback(async () => {
    try {
      const { sound, isNew } = await ensureSound(selectedTrackId);
      if (!sound) {
        return;
      }

      await sound.setIsLoopingAsync(true);

      if (isPlayingRef.current) {
        if (isNew) {
          await sound.playFromPositionAsync(0);
        } else {
          await sound.playAsync();
        }
        console.log('[AmbientAudio]', 'Playing track', trackRef.current);
      } else {
        await sound.pauseAsync();
        console.log('[AmbientAudio]', 'Paused track', trackRef.current);
      }

      setError(null);
    } catch (caught) {
      console.warn('Ambient playback failed', caught);
      setError(caught instanceof Error ? caught : new Error('Ambient playback failed to start'));
      setIsPlaying(false);
    }
  }, [ensureSound, selectedTrackId]);

  useEffect(() => {
    applyPlaybackState().catch((caught) => {
      console.warn('Unable to apply ambient playback state', caught);
    });
  }, [applyPlaybackState, isPlaying]);

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {
          // best effort cleanup
        });
      }
    };
  }, []);

  const selectTrack = useCallback((trackId: MusicOption['id']) => {
    setSelectedTrackId(trackId);
    setIsPlaying(true);
    setError(null);
  }, []);

  const play = useCallback(() => {
    setIsPlaying(true);
  }, []);

  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const togglePlayback = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const showSleepAlert = useCallback((alert: SleepAlertState) => {
    setSleepAlert(alert);
  }, []);

  const dismissSleepAlert = useCallback(() => {
    setSleepAlert((current) => {
      if (current?.onDismiss) {
        try {
          current.onDismiss();
        } catch (caught) {
          console.warn('Sleep alert dismissal failed', caught);
        }
      }

      return null;
    });
  }, []);

  const value = useMemo(
    () => ({
      selectedTrackId,
      isPlaying,
      error,
      selectTrack,
      togglePlayback,
      play,
      pause,
      sleepAlert,
      showSleepAlert,
      dismissSleepAlert,
    }),
    [
      dismissSleepAlert,
      error,
      isPlaying,
      pause,
      play,
      selectTrack,
      selectedTrackId,
      showSleepAlert,
      sleepAlert,
      togglePlayback,
    ]
  );

  return (
    <AmbientAudioContext.Provider value={value}>
      {children}
      <Modal
        transparent
        animationType="fade"
        visible={Boolean(sleepAlert)}
        onRequestClose={dismissSleepAlert}
      >
        <View style={sleepAlertStyles.overlay}>
          <View style={sleepAlertStyles.card}>
            <Text style={sleepAlertStyles.title}>{sleepAlert?.title ?? 'Dream Capsule'}</Text>
            <Text style={sleepAlertStyles.message}>{sleepAlert?.message ?? ''}</Text>
            <Pressable
              style={sleepAlertStyles.button}
              onPress={dismissSleepAlert}
              accessibilityRole="button"
              accessibilityLabel="Dismiss Dream Capsule alert"
            >
              <Text style={sleepAlertStyles.buttonText}>
                {sleepAlert?.tone === 'alarm' ? 'Stop alarm' : 'Dismiss'}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </AmbientAudioContext.Provider>
  );
}

const sleepAlertStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 22,
    backgroundColor: '#ecfdf3',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    padding: 20,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#0f172a',
    shadowOpacity: 0.2,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#14532d',
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#1f2937',
    textAlign: 'center',
    lineHeight: 20,
  },
  button: {
    marginTop: 4,
    borderRadius: 12,
    backgroundColor: '#14532d',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  buttonText: {
    color: '#f0fff4',
    fontWeight: '700',
    fontSize: 14,
  },
});

export function useAmbientAudio() {
  const context = useContext(AmbientAudioContext);
  if (!context) {
    throw new Error('useAmbientAudio must be used within an AmbientAudioProvider');
  }

  return context;
}
