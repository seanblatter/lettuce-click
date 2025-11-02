
import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Audio } from 'expo-av';

import { MUSIC_AUDIO_MAP, MUSIC_OPTIONS, type MusicOption } from '@/constants/music';

type AmbientAudioContextValue = {
  selectedTrackId: MusicOption['id'];
  isPlaying: boolean;
  error: Error | null;
  selectTrack: (trackId: MusicOption['id']) => void;
  togglePlayback: () => void;
  play: () => void;
  pause: () => void;
};

const AmbientAudioContext = createContext<AmbientAudioContextValue | undefined>(undefined);

type ProviderProps = {
  children: ReactNode;
};

export function AmbientAudioProvider({ children }: ProviderProps) {
  const [selectedTrackId, setSelectedTrackId] = useState<MusicOption['id']>(MUSIC_OPTIONS[0].id);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<Error | null>(null);
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

  const value = useMemo(
    () => ({
      selectedTrackId,
      isPlaying,
      error,
      selectTrack,
      togglePlayback,
      play,
      pause,
    }),
    [error, isPlaying, pause, play, selectTrack, selectedTrackId, togglePlayback]
  );

  return <AmbientAudioContext.Provider value={value}>{children}</AmbientAudioContext.Provider>;
}

export function useAmbientAudio() {
  const context = useContext(AmbientAudioContext);
  if (!context) {
    throw new Error('useAmbientAudio must be used within an AmbientAudioProvider');
  }

  return context;
}
