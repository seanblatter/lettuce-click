import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import { OrbitingEmoji } from '@/context/GameContext';

const FULL_ROTATION_RADIANS = Math.PI * 2;
const DEFAULT_RADIUS = 120;

type OrbitingUpgradeEmojisProps = {
  emojis: OrbitingEmoji[];
  radius?: number;
};

export function OrbitingUpgradeEmojis({ emojis, radius = DEFAULT_RADIUS }: OrbitingUpgradeEmojisProps) {
  const rotation = useRef(new Animated.Value(0)).current;
  const previousIds = useRef<string[]>([]);
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);
  const [flyaways, setFlyaways] = useState<FlyawayEntry[]>([]);

  const hiddenSet = useMemo(() => new Set(hiddenIds), [hiddenIds]);

  const visibleEmojis = useMemo(
    () => emojis.filter((item) => !hiddenSet.has(item.id)),
    [emojis, hiddenSet]
  );

  useEffect(() => {
    if (visibleEmojis.length === 0) {
      rotation.stopAnimation();
      rotation.setValue(0);
      return;
    }

    const loop = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 12000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    loop.start();

    return () => {
      loop.stop();
      rotation.stopAnimation();
    };
  }, [rotation, visibleEmojis.length]);

  const rotate = useMemo(
    () =>
      rotation.interpolate({
        inputRange: [0, 1],
        outputRange: ['0rad', `${FULL_ROTATION_RADIANS}rad`],
      }),
    [rotation]
  );

  const positioned = useMemo(() => {
    if (visibleEmojis.length === 0) {
      return [];
    }

    return visibleEmojis.map((item, index) => ({
      ...item,
      angle: (FULL_ROTATION_RADIANS * index) / visibleEmojis.length,
    }));
  }, [visibleEmojis]);

  useEffect(() => {
    const currentIds = emojis.map((item) => item.id);
    const prevIds = previousIds.current;

    const newIds = currentIds.filter((id) => !prevIds.includes(id));

    if (currentIds.length > FLYAWAY_THRESHOLD) {
      newIds.forEach((id) => {
        const entry = emojis.find((item) => item.id === id);

        if (!entry) {
          return;
        }

        if (Math.random() < FLYAWAY_CHANCE) {
          setHiddenIds((prev) => {
            if (prev.includes(id)) {
              return prev;
            }
            return [...prev, id];
          });

          setFlyaways((prev) => [
            ...prev,
            {
              id,
              emoji: entry.emoji,
              angle: Math.random() * FULL_ROTATION_RADIANS,
            },
          ]);
        }
      });
    }

    previousIds.current = currentIds;
  }, [emojis]);

  useEffect(() => {
    const activeIds = new Set(emojis.map((item) => item.id));
    setHiddenIds((prev) => {
      const filtered = prev.filter((id) => activeIds.has(id));
      return filtered.length === prev.length ? prev : filtered;
    });
  }, [emojis]);

  useEffect(() => {
    if (emojis.length <= FLYAWAY_THRESHOLD) {
      return;
    }

    const interval = setInterval(() => {
      setHiddenIds((prevHidden) => {
        const hidden = new Set(prevHidden);
        const candidates = emojis.filter((item) => !hidden.has(item.id));

        if (candidates.length === 0 || Math.random() > FLYAWAY_IDLE_CHANCE) {
          return prevHidden;
        }

        const selection = candidates[Math.floor(Math.random() * candidates.length)];

        hidden.add(selection.id);
        setFlyaways((prev) => [
          ...prev,
          {
            id: selection.id,
            emoji: selection.emoji,
            angle: Math.random() * FULL_ROTATION_RADIANS,
          },
        ]);

        return Array.from(hidden);
      });
    }, FLYAWAY_IDLE_INTERVAL);

    return () => clearInterval(interval);
  }, [emojis]);

  const handleFlyawayComplete = useCallback((id: string) => {
    setFlyaways((prev) => prev.filter((item) => item.id !== id));
  }, []);

  if (positioned.length === 0 && flyaways.length === 0) {
    return null;
  }

  return (
    <View pointerEvents="none" style={styles.wrapper}>
      {positioned.length > 0 && (
        <Animated.View style={[styles.container, { transform: [{ rotate }] }]}>
          {positioned.map(({ emoji, angle, id }) => (
            <Animated.View
              key={id}
              style={[
                styles.emojiWrapper,
                {
                  transform: [
                    { rotate: `${angle}rad` },
                    { translateX: radius },
                    { rotate: `${-angle}rad` },
                  ],
                },
              ]}>
              <Text style={styles.emoji}>{emoji}</Text>
            </Animated.View>
          ))}
        </Animated.View>
      )}

      {flyaways.map((item) => (
        <FlyawayEmoji
          key={item.id}
          angle={item.angle}
          emoji={item.emoji}
          onComplete={() => handleFlyawayComplete(item.id)}
        />
      ))}
    </View>
  );
}

type FlyawayEntry = {
  id: string;
  emoji: string;
  angle: number;
};

type FlyawayEmojiProps = {
  emoji: string;
  angle: number;
  onComplete: () => void;
};

const FLYAWAY_THRESHOLD = 50;
const FLYAWAY_CHANCE = 0.35;
const FLYAWAY_DISTANCE = 260;
const FLYAWAY_DURATION = 1600;
const FLYAWAY_IDLE_INTERVAL = 6000;
const FLYAWAY_IDLE_CHANCE = 0.25;

function FlyawayEmoji({ emoji, angle, onComplete }: FlyawayEmojiProps) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: FLYAWAY_DURATION,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(onComplete);
  }, [onComplete, progress]);

  const deltaX = Math.cos(angle) * FLYAWAY_DISTANCE;
  const deltaY = Math.sin(angle) * FLYAWAY_DISTANCE;

  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, deltaX],
  });
  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, deltaY],
  });
  const opacity = progress.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: [1, 1, 0],
  });
  const scale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.2],
  });

  return (
    <Animated.Text
      style={[
        styles.flyaway,
        {
          transform: [{ translateX }, { translateY }, { scale }],
          opacity,
        },
      ]}
    >
      {emoji}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiWrapper: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 26,
  },
  flyaway: {
    position: 'absolute',
    fontSize: 26,
  },
});
