
import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAudioPlayer } from 'expo-audio';

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
  const player = useAudioPlayer(MUSIC_AUDIO_MAP[selectedTrackId]);
  const isPlayingRef = useRef(isPlaying);
  const trackRef = useRef(selectedTrackId);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    trackRef.current = selectedTrackId;
  }, [selectedTrackId]);

  const ensurePlayback = useCallback(
    async (source: number, shouldPlayOverride?: boolean) => {
      const desiredPlayState = shouldPlayOverride ?? isPlayingRef.current;
      const playerAny: any = player;

      try {
        const playbackOptions = {
          isLooping: true,
          shouldPlay: desiredPlayState,
        };

        let startedWithSource = false;

        if (playerAny && typeof playerAny.replace === 'function') {
          await Promise.resolve(playerAny.replace(source, playbackOptions));
          startedWithSource = true;
        } else if (playerAny && typeof playerAny.loadAsync === 'function') {
          await Promise.resolve(playerAny.stop?.());
          await Promise.resolve(playerAny.unloadAsync?.());
          await Promise.resolve(playerAny.loadAsync(source, playbackOptions));
        } else if (playerAny && typeof playerAny.play === 'function' && playerAny.play.length >= 1) {
          await Promise.resolve(playerAny.play(source, playbackOptions));
          startedWithSource = true;
        } else if (playerAny && typeof playerAny.setSource === 'function') {
          await Promise.resolve(playerAny.setSource(source));
        }

        if (playerAny) {
          if (typeof playerAny.setStatus === 'function') {
            await Promise.resolve(playerAny.setStatus({ isLooping: true }));
          } else if (typeof playerAny.updateStatus === 'function') {
            await Promise.resolve(playerAny.updateStatus({ isLooping: true }));
          }

          if (desiredPlayState) {
            if (!startedWithSource) {
              if (typeof playerAny.play === 'function' && playerAny.play.length === 0) {
                await Promise.resolve(playerAny.play());
              } else if (typeof playerAny.playAsync === 'function') {
                await Promise.resolve(playerAny.playAsync());
              } else if (typeof playerAny.replayAsync === 'function') {
                await Promise.resolve(playerAny.replayAsync());
              } else {
                playerAny.seekTo?.(0);
                playerAny.play?.();
              }
            }
            console.log('[AmbientAudio]', 'Playing track', trackRef.current);
          } else {
            playerAny.pause?.();
            console.log('[AmbientAudio]', 'Paused track', trackRef.current);
          }
        }

        setError(null);
      } catch (caught) {
        console.warn('Ambient playback failed', caught);
        setError(caught instanceof Error ? caught : new Error('Ambient playback failed to start'));
        setIsPlaying(false);
      }
    },
    [player]
  );

  useEffect(() => {
    const source = MUSIC_AUDIO_MAP[selectedTrackId];
    if (!source) {
      return;
    }

    ensurePlayback(source, isPlaying).catch((caught) => {
      console.warn('Unable to apply ambient playback state', caught);
    });
  }, [ensurePlayback, isPlaying, selectedTrackId]);

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
