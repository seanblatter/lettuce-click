import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, Text, View } from 'react-native';

import type { HomeEmojiTheme, OrbitingEmoji } from '@/context/GameContext';

const FULL_ROTATION_RADIANS = Math.PI * 2;
const DEFAULT_RADIUS = 120;
const SPIRAL_STEP = 12;
const MATRIX_MAX_EMOJIS = 12;

const WINDOW = Dimensions.get('window');
const WINDOW_WIDTH = WINDOW.width;
const WINDOW_HEIGHT = WINDOW.height;
const MATRIX_EXTRA_SPREAD = 160;
const MATRIX_WIDTH = WINDOW_WIDTH + MATRIX_EXTRA_SPREAD;
const MATRIX_HEIGHT = WINDOW_HEIGHT * 1.6;
const MATRIX_START_Y = -WINDOW_HEIGHT * 0.6;
const MATRIX_END_Y = WINDOW_HEIGHT + 160;
const MATRIX_EMOJI_SIZE = 26;

type OrbitingUpgradeEmojisProps = {
  emojis: OrbitingEmoji[];
  radius?: number;
  theme?: HomeEmojiTheme;
};

export function OrbitingUpgradeEmojis({ emojis, radius = DEFAULT_RADIUS, theme = 'circle' }: OrbitingUpgradeEmojisProps) {
  if (emojis.length === 0) {
    return null;
  }

  if (theme === 'matrix') {
    return <MatrixEmojiRain emojis={emojis} radius={radius} />;
  }

  return <OrbitingRing emojis={emojis} radius={radius} theme={theme} />;
}

type OrbitingRingProps = {
  emojis: OrbitingEmoji[];
  radius: number;
  theme: HomeEmojiTheme;
};

function OrbitingRing({ emojis, radius, theme }: OrbitingRingProps) {
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    rotation.stopAnimation();
    rotation.setValue(0);

    if (emojis.length === 0) {
      return;
    }

    const loop = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: theme === 'spiral' ? 16000 : 12000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    loop.start();

    return () => {
      loop.stop();
    };
  }, [emojis.length, rotation, theme]);

  const rotate = useMemo(
    () =>
      rotation.interpolate({
        inputRange: [0, 1],
        outputRange: ['0rad', `${FULL_ROTATION_RADIANS}rad`],
      }),
    [rotation]
  );

  const positioned = useMemo(() => {
    if (emojis.length === 0) {
      return [];
    }

    const limit = emojis.slice(0, 48);
    return limit.map((item, index) => {
      const angle = (FULL_ROTATION_RADIANS * index) / limit.length;
      const distance = theme === 'spiral' ? radius * 0.45 + index * SPIRAL_STEP : radius;

      return { ...item, angle, distance };
    });
  }, [emojis, radius, theme]);

  if (positioned.length === 0) {
    return null;
  }

  return (
    <View pointerEvents="none" style={styles.wrapper}>
      <Animated.View style={[styles.container, { transform: [{ rotate }] }]}>
        {positioned.map(({ id, emoji, angle, distance }) => (
          <Animated.View
            key={id}
            style={[
              styles.emojiWrapper,
              {
                transform: [
                  { rotate: `${angle}rad` },
                  { translateX: distance },
                  { rotate: `${-angle}rad` },
                ],
              },
            ]}>
            <Text style={[styles.emoji, theme === 'spiral' && styles.emojiSpiral]}>{emoji}</Text>
          </Animated.View>
        ))}
      </Animated.View>
    </View>
  );
}

type MatrixDrop = {
  id: string;
  animated: Animated.Value;
  translateY: Animated.AnimatedInterpolation<string | number>;
  loop: Animated.CompositeAnimation;
  left: number;
};

type MatrixEmojiRainProps = {
  emojis: OrbitingEmoji[];
  radius: number;
};

function MatrixEmojiRain({ emojis, radius }: MatrixEmojiRainProps) {
  const [drops, setDrops] = useState<MatrixDrop[]>([]);
  const dropsRef = useRef<MatrixDrop[]>([]);

  useEffect(() => {
    return () => {
      dropsRef.current.forEach((drop) => drop.loop.stop());
    };
  }, []);

  useEffect(() => {
    setDrops((prev) => {
      const limited = emojis.slice(0, MATRIX_MAX_EMOJIS);
      const next: MatrixDrop[] = [];
      const retained = new Set<string>();

      limited.forEach((emoji, index) => {
        const startAtTop = index === 0;
        const targetLeft = getMatrixLeft(index);
        const existing = prev.find((drop) => drop.id === emoji.id);
        if (existing) {
          retained.add(existing.id);
          next.push({ ...existing, left: targetLeft });
        } else {
          next.push(createMatrixDrop(emoji.id, startAtTop, targetLeft));
        }
      });

      prev.forEach((drop) => {
        if (!retained.has(drop.id)) {
          drop.loop.stop();
        }
      });

      dropsRef.current = next;
      return next;
    });
  }, [emojis]);

  if (drops.length === 0) {
    return null;
  }

  const horizontalOffset = -(MATRIX_WIDTH - radius * 2) / 2;

  return (
    <View
      pointerEvents="none"
      style={[
        styles.matrixWrapper,
        {
          width: MATRIX_WIDTH,
          height: MATRIX_HEIGHT,
          top: 0,
          left: horizontalOffset,
        },
      ]}>
      {drops.map((drop) => {
        const emoji = emojis.find((item) => item.id === drop.id);
        if (!emoji) {
          return null;
        }

        return (
          <Animated.Text
            key={drop.id}
            style={[
              styles.matrixEmoji,
              {
                transform: [{ translateY: drop.translateY }],
                left: drop.left,
              },
            ]}>
            {emoji.emoji}
          </Animated.Text>
        );
      })}
    </View>
  );
}

function createMatrixDrop(id: string, startAtTop: boolean, left: number): MatrixDrop {
  const animated = new Animated.Value(startAtTop ? 0 : Math.random());
  const duration = 3600 + Math.random() * 2400;

  const loop = Animated.loop(
    Animated.sequence([
      Animated.timing(animated, {
        toValue: 1,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      Animated.timing(animated, {
        toValue: 0,
        duration: 0,
        useNativeDriver: true,
      }),
    ])
  );

  loop.start();

  const translateY = animated.interpolate({
    inputRange: [0, 1],
    outputRange: [MATRIX_START_Y, MATRIX_END_Y],
  });

  return {
    id,
    animated,
    translateY,
    loop,
    left,
  };
}

function getMatrixLeft(index: number) {
  if (index === 0) {
    return MATRIX_WIDTH / 2 - MATRIX_EMOJI_SIZE / 2;
  }

  const padding = 32;
  return padding + Math.random() * (MATRIX_WIDTH - padding * 2);
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
  emojiSpiral: {
    fontSize: 22,
  },
  matrixWrapper: {
    position: 'absolute',
    alignItems: 'flex-start',
  },
  matrixEmoji: {
    position: 'absolute',
    fontSize: 24,
    color: '#bbf7d0',
    textShadowColor: 'rgba(15, 118, 110, 0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
});
