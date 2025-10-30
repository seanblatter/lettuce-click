import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, Text, View } from 'react-native';

import type { HomeEmojiTheme, OrbitingEmoji } from '@/context/GameContext';

const FULL_ROTATION_RADIANS = Math.PI * 2;
const DEFAULT_RADIUS = 120;
const SPIRAL_STEP = 14;
const SPIRAL_BASE_RADIUS_RATIO = 0.35;
const SPIRAL_DEFAULT_ARMS = 4;
const SPIRAL_MAX_ARMS = 6;
const SPIRAL_ANGLE_STEP = Math.PI / 24;
const MATRIX_MAX_EMOJIS = 28;

const WINDOW = Dimensions.get('window');
const WINDOW_WIDTH = WINDOW.width;
const WINDOW_HEIGHT = WINDOW.height;
const MATRIX_EXTRA_SPREAD = 180;
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
  if (emojis.length === 0 || theme === 'clear') {
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

type PositionedEmoji = OrbitingEmoji & {
  angle: number;
  distance: number;
  driftDirection?: number;
  driftScale?: number;
  baseDistance?: Animated.Value;
};

type OrbitingSpriteProps = {
  item: PositionedEmoji;
  theme: HomeEmojiTheme;
  spiralDrift: Animated.Value;
};

function OrbitingRing({ emojis, radius, theme }: OrbitingRingProps) {
  const rotation = useRef(new Animated.Value(0)).current;
  const spiralDrift = useRef(new Animated.Value(0)).current;

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

  useEffect(() => {
    spiralDrift.stopAnimation();
    spiralDrift.setValue(0);

    if (theme !== 'spiral' || emojis.length === 0) {
      return;
    }

    const driftLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(spiralDrift, {
          toValue: 1,
          duration: 16000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(spiralDrift, {
          toValue: -1,
          duration: 16000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

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

  const positioned = useMemo<PositionedEmoji[]>(() => {
    if (emojis.length === 0) {
      return [];
    }

    const limit = emojis.slice(0, theme === 'spiral' ? 72 : 48);

    if (theme === 'spiral') {
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

        const driftDirection = index % 2 === 0 ? 1 : -1;
        const driftScale = SPIRAL_STEP * 0.9 + stepIndex * 4;

        return {
          ...item,
          angle,
          distance,
          driftDirection,
          driftScale,
          baseDistance: new Animated.Value(distance),
        };
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
        {positioned.map((item) => (
          <OrbitingSprite key={item.id} item={item} theme={theme} spiralDrift={spiralDrift} />
        ))}
      </Animated.View>
    </View>
  );
}

function OrbitingSprite(props: OrbitingSpriteProps) {
  const { item, theme, spiralDrift } = props;
  const { emoji, angle, distance } = item;
  const direction = typeof item.driftDirection === 'number' ? item.driftDirection : 1;
  const scale = typeof item.driftScale === 'number' ? item.driftScale : SPIRAL_STEP;
  const baseDistanceValue =
    item.baseDistance !== undefined ? item.baseDistance : new Animated.Value(distance);

  let translateXValue: number | Animated.AnimatedInterpolation<string | number> = distance;

  if (theme === 'spiral') {
    const drift = Animated.multiply(spiralDrift, direction * scale);
    translateXValue = Animated.add(
      baseDistanceValue,
      drift
    ) as Animated.AnimatedInterpolation<string | number>;
  }

  return (
    <Animated.View
      style={[
        styles.emojiWrapper,
        {
          transform: [
            { rotate: `${angle}rad` },
            { translateX: translateXValue },
            { rotate: `${-angle}rad` },
          ],
        },
      ]}>
      <Text style={[styles.emoji, theme === 'spiral' && styles.emojiSpiral]}>{emoji}</Text>
    </Animated.View>
  );
}

type MatrixDrop = {
  id: string;
  animated: Animated.Value;
  translateY: Animated.AnimatedInterpolation<string | number>;
  loop: Animated.CompositeAnimation;
  left: number;
  column: number;
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
      const limited = emojis.slice(0, Math.min(MATRIX_MAX_EMOJIS, emojis.length));
      const next: MatrixDrop[] = [];
      const retained = new Set<string>();

      limited.forEach((emoji) => {
        const column = getMatrixColumn(emoji.id);
        const targetLeft = getMatrixLeft(column);
        const existing = prev.find((drop) => drop.id === emoji.id);

        if (existing) {
          retained.add(existing.id);
          if (existing.left !== targetLeft || existing.column !== column) {
            next.push({ ...existing, left: targetLeft, column });
          } else {
            next.push(existing);
          }
        } else {
          next.push(createMatrixDrop(emoji.id, column, targetLeft));
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

function createMatrixDrop(id: string, column: number, left: number): MatrixDrop {
  const animated = new Animated.Value(0);
  const duration = getMatrixDuration(column);

  const loop = Animated.loop(
    Animated.sequence([
      Animated.delay(getMatrixDelay(column)),
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
  };
}

const MATRIX_PADDING = 32;
const MATRIX_COLUMNS: number = 8;
const MATRIX_DURATION_BASE = 2800;
const MATRIX_DURATION_VARIATION = 900;
const MATRIX_DELAY_STEP = 110;

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

function getMatrixDuration(column: number) {
  const progress = column / Math.max(1, MATRIX_COLUMNS - 1);
  return MATRIX_DURATION_BASE + progress * MATRIX_DURATION_VARIATION;
}

function getMatrixDelay(column: number) {
  return column * MATRIX_DELAY_STEP;
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
