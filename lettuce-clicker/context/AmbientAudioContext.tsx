
import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';

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
  const [error, setError] = useState<Error | null>(null);
  
  const player = useAudioPlayer(MUSIC_AUDIO_MAP[selectedTrackId]);
  const status = useAudioPlayerStatus(player);
  
  const isPlaying = status.playing;
  
  // Handle track changes
  useEffect(() => {
    const source = MUSIC_AUDIO_MAP[selectedTrackId];
    if (source) {
      try {
        player.replace(source);
        player.loop = true;
        setError(null);
      } catch (caught) {
        console.warn('Failed to load ambient audio', caught);
        setError(caught instanceof Error ? caught : new Error('Failed to load ambient audio'));
      }
    }
  }, [selectedTrackId, player]);

  const selectTrack = useCallback((trackId: MusicOption['id']) => {
    setSelectedTrackId(trackId);
    setError(null);
    // Auto-play when selecting a new track
    setTimeout(() => {
      try {
        player.play();
      } catch (caught) {
        console.warn('Failed to start playback', caught);
        setError(caught instanceof Error ? caught : new Error('Failed to start playback'));
      }
    }, 100); // Small delay to ensure track is loaded
  }, [player]);

  const play = useCallback(() => {
    try {
      player.play();
      setError(null);
    } catch (caught) {
      console.warn('Failed to start playback', caught);
      setError(caught instanceof Error ? caught : new Error('Failed to start playback'));
    }
  }, [player]);

  const pause = useCallback(() => {
    try {
      player.pause();
      setError(null);
    } catch (caught) {
      console.warn('Failed to pause playback', caught);
      setError(caught instanceof Error ? caught : new Error('Failed to pause playback'));
    }
  }, [player]);

  const togglePlayback = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

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
