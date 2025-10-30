import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, Text, View } from 'react-native';

import type { HomeEmojiTheme, OrbitingEmoji } from '@/context/GameContext';

const FULL_ROTATION_RADIANS = Math.PI * 2;
const DEFAULT_RADIUS = 120;
const SPIRAL_STEP = 10;
const SPIRAL_BASE_RADIUS_RATIO = 0.28;
const SPIRAL_DEFAULT_ARMS = 4;
const SPIRAL_MAX_ARMS = 6;
const SPIRAL_ANGLE_STEP = Math.PI / 28;
const SPIRAL_DRIFT_RANGE = 48;
const SPIRAL_DRIFT_DURATION = 20000;
const MATRIX_MAX_EMOJIS = 28;

const WINDOW = Dimensions.get('window');
const WINDOW_WIDTH = WINDOW.width;
const WINDOW_HEIGHT = WINDOW.height;
const MATRIX_EXTRA_SPREAD = 220;
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

const resolveBaseTheme = (theme: HomeEmojiTheme): 'circle' | 'spiral' | 'matrix' | 'clear' => {
  switch (theme) {
    case 'clear':
      return 'clear';
    case 'matrix':
    case 'confetti':
      return 'matrix';
    case 'spiral':
    case 'wave':
    case 'echo':
    case 'aurora':
    case 'starlight':
    case 'nebula':
      return 'spiral';
    default:
      return 'circle';
  }
};

export function OrbitingUpgradeEmojis({ emojis, radius = DEFAULT_RADIUS, theme = 'circle' }: OrbitingUpgradeEmojisProps) {
  const baseTheme = resolveBaseTheme(theme);

  if (emojis.length === 0 || baseTheme === 'clear') {
    return null;
  }

  if (baseTheme === 'matrix') {
    return <MatrixEmojiRain emojis={emojis} radius={radius} variant={theme} />;
  }

  return <OrbitingRing emojis={emojis} radius={radius} theme={theme} pattern={baseTheme} />;
}

type OrbitingRingProps = {
  emojis: OrbitingEmoji[];
  radius: number;
  theme: HomeEmojiTheme;
  pattern: 'circle' | 'spiral';
};

function OrbitingRing({ emojis, radius, theme, pattern }: OrbitingRingProps) {
  const rotation = useRef(new Animated.Value(0)).current;
  const spiralDrift = useRef(new Animated.Value(0)).current;
  const spiralLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    rotation.stopAnimation();
    rotation.setValue(0);

    if (emojis.length === 0) {
      return;
    }

    const loop = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: pattern === 'spiral' ? 16000 : 12000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    loop.start();

    return () => {
      loop.stop();
    };
  }, [emojis.length, rotation, theme]);

  useEffect(() => {
    spiralLoopRef.current?.stop();

    if (pattern !== 'spiral' || emojis.length === 0) {
      spiralDrift.setValue(0);
      return;
    }

    spiralDrift.setValue(0);
    const driftLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(spiralDrift, {
          toValue: 1,
          duration: SPIRAL_DRIFT_DURATION,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(spiralDrift, {
          toValue: 0,
          duration: SPIRAL_DRIFT_DURATION,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    spiralLoopRef.current = driftLoop;
    driftLoop.start();

    return () => {
      driftLoop.stop();
    };
  }, [emojis.length, spiralDrift, theme]);

  const rotate = useMemo(
    () =>
      rotation.interpolate({
        inputRange: [0, 1],
        outputRange: ['0rad', `${FULL_ROTATION_RADIANS}rad`],
      }),
    [rotation]
  );

  const themeEmojiStyle = useMemo(() => {
    switch (theme) {
      case 'bubble':
        return styles.emojiBubble;
      case 'bubble-pop':
        return styles.emojiBubblePop;
      case 'wave':
      case 'echo':
        return styles.emojiWave;
      case 'laser':
        return styles.emojiLaser;
      case 'aurora':
        return styles.emojiAurora;
      case 'firefly':
        return styles.emojiFirefly;
      case 'starlight':
        return styles.emojiStarlight;
      case 'nebula':
        return styles.emojiNebula;
      case 'supernova':
        return styles.emojiSupernova;
      default:
        return null;
    }
  }, [theme]);

  const positioned = useMemo(() => {
    if (emojis.length === 0) {
      return [];
    }

    const limit = emojis.slice(0, pattern === 'spiral' ? 72 : 48);

    if (pattern === 'spiral') {
      const maxPossibleArms = Math.max(1, Math.min(limit.length, SPIRAL_MAX_ARMS));
      const desiredArms = Math.max(SPIRAL_DEFAULT_ARMS, Math.ceil(limit.length / 6));
      const arms = Math.max(1, Math.min(maxPossibleArms, desiredArms));

      return limit.map((item, index) => {
        const armIndex = index % arms;
        const stepIndex = Math.floor(index / arms);
        const baseDistance = radius * SPIRAL_BASE_RADIUS_RATIO + stepIndex * SPIRAL_STEP;
        const armOffset = armIndex * (SPIRAL_STEP * 0.4);
        const distance = baseDistance + armOffset;
        const angle =
          (FULL_ROTATION_RADIANS / arms) * armIndex + stepIndex * SPIRAL_ANGLE_STEP;

        return { ...item, angle, distance };
      });
    }

    return limit.map((item, index) => {
      const angle = (FULL_ROTATION_RADIANS * index) / limit.length;
      return { ...item, angle, distance: radius };
    });
  }, [emojis, radius, theme]);

  if (positioned.length === 0) {
    return null;
  }

  return (
    <View pointerEvents="none" style={styles.wrapper}>
      <Animated.View style={[styles.container, { transform: [{ rotate }] }]}>
        {positioned.map(({ id, emoji, angle, distance }) => {
          const translateTransform =
            pattern === 'spiral'
              ? {
                  translateX: spiralDrift.interpolate({
                    inputRange: [0, 1],
                    outputRange: [distance, distance + SPIRAL_DRIFT_RANGE],
                  }),
                }
              : { translateX: distance };

          return (
            <Animated.View
              key={id}
              style={[
                styles.emojiWrapper,
                {
                  transform: [
                    { rotate: `${angle}rad` },
                    translateTransform,
                    { rotate: `${-angle}rad` },
                  ],
                },
              ]}>
              <Text style={[styles.emoji, pattern === 'spiral' && styles.emojiSpiral, themeEmojiStyle]}>{emoji}</Text>
            </Animated.View>
          );
        })}
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
  column: number;
  variant: HomeEmojiTheme;
};

type MatrixEmojiRainProps = {
  emojis: OrbitingEmoji[];
  radius: number;
  variant: HomeEmojiTheme;
};

function MatrixEmojiRain({ emojis, radius, variant }: MatrixEmojiRainProps) {
  const [drops, setDrops] = useState<MatrixDrop[]>([]);
  const dropsRef = useRef<MatrixDrop[]>([]);

  const isConfetti = variant === 'confetti';

  useEffect(() => {
    return () => {
      dropsRef.current.forEach((drop) => drop.loop.stop());
    };
  }, []);

  useEffect(() => {
    setDrops((prev) => {
      const limited = emojis.slice(0, Math.min(MATRIX_MAX_EMOJIS, emojis.length));
      const next: MatrixDrop[] = [];
      const retained = new Set<string>();

      limited.forEach((emoji) => {
        const column = getMatrixColumn(emoji.id);
        const targetLeft = getMatrixLeft(column);
        const existing = prev.find((drop) => drop.id === emoji.id);

        if (existing) {
          retained.add(existing.id);
          const needsRefresh =
            existing.left !== targetLeft || existing.column !== column || existing.variant !== variant;
          if (needsRefresh) {
            existing.loop.stop();
            next.push(createMatrixDrop(emoji.id, column, targetLeft, variant));
          } else {
            next.push(existing);
          }
        } else {
          next.push(createMatrixDrop(emoji.id, column, targetLeft, variant));
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
  }, [emojis, variant]);

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
              isConfetti && styles.matrixEmojiConfetti,
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

function createMatrixDrop(id: string, column: number, left: number, variant: HomeEmojiTheme): MatrixDrop {
  const animated = new Animated.Value(0);
  const duration = getMatrixDuration(column, variant);

  const loop = Animated.loop(
    Animated.sequence([
      Animated.delay(getMatrixDelay(column, variant)),
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
    column,
    variant,
  };
}

const MATRIX_PADDING = 32;
const MATRIX_COLUMNS = 7;
const MATRIX_DURATION_BASE = 2800;
const MATRIX_DURATION_VARIATION = 1200;
const MATRIX_DELAY_STEP = 90;
const CONFETTI_DURATION_BASE = 1800;
const CONFETTI_DURATION_VARIATION = 900;
const CONFETTI_DELAY_STEP = 60;

function getMatrixColumn(id: string) {
  let hash = 0;
  for (let index = 0; index < id.length; index += 1) {
    hash = (hash * 31 + id.charCodeAt(index)) & 0xffffffff;
  }

  return Math.abs(hash) % MATRIX_COLUMNS;
}

function getMatrixLeft(column: number) {
  const availableWidth = MATRIX_WIDTH - MATRIX_PADDING * 2 - MATRIX_EMOJI_SIZE;
  if (availableWidth <= 0) {
    return MATRIX_PADDING;
  }

  if (MATRIX_COLUMNS === 1) {
    return MATRIX_PADDING + availableWidth / 2;
  }

  const step = availableWidth / (MATRIX_COLUMNS - 1);
  return MATRIX_PADDING + column * step;
}

function getMatrixDuration(column: number, variant: HomeEmojiTheme) {
  const progress = column / Math.max(1, MATRIX_COLUMNS - 1);
  const base = variant === 'confetti' ? CONFETTI_DURATION_BASE : MATRIX_DURATION_BASE;
  const variation = variant === 'confetti' ? CONFETTI_DURATION_VARIATION : MATRIX_DURATION_VARIATION;
  return base + progress * variation;
}

function getMatrixDelay(column: number, variant: HomeEmojiTheme) {
  const step = variant === 'confetti' ? CONFETTI_DELAY_STEP : MATRIX_DELAY_STEP;
  return column * step;
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
  emojiBubble: {
    textShadowColor: '#bae6fd',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  emojiBubblePop: {
    textShadowColor: '#fbbf24',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  emojiWave: {
    textShadowColor: '#38bdf8',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 9,
  },
  emojiLaser: {
    textShadowColor: '#f472b6',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  emojiAurora: {
    textShadowColor: '#a855f7',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 14,
  },
  emojiFirefly: {
    textShadowColor: '#fde68a',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  emojiStarlight: {
    textShadowColor: '#c4b5fd',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 11,
  },
  emojiNebula: {
    textShadowColor: '#818cf8',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 13,
  },
  emojiSupernova: {
    textShadowColor: '#fb7185',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 14,
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
  matrixEmojiConfetti: {
    color: '#f97316',
    textShadowColor: '#fed7aa',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
});
