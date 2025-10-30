import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, Text, View } from 'react-native';

import type { HomeEmojiTheme, OrbitingEmoji } from '@/context/GameContext';

const FULL_ROTATION_RADIANS = Math.PI * 2;
const DEFAULT_RADIUS = 120;
const WINDOW = Dimensions.get('window');
const WINDOW_WIDTH = WINDOW.width;
const WINDOW_HEIGHT = WINDOW.height;

const MATRIX_EXTRA_SPREAD = 220;
const MATRIX_WIDTH = WINDOW_WIDTH + MATRIX_EXTRA_SPREAD;
const MATRIX_HEIGHT = WINDOW_HEIGHT * 1.6;
const MATRIX_START_Y = -WINDOW_HEIGHT * 0.6;
const MATRIX_END_Y = WINDOW_HEIGHT + 160;
const MATRIX_EMOJI_SIZE = 26;
const MATRIX_PADDING = 32;
const MATRIX_COLUMNS = 7;
const MATRIX_DURATION_BASE = 2800;
const MATRIX_DURATION_VARIATION = 1200;
const MATRIX_DELAY_STEP = 90;

const CONFETTI_DURATION_BASE = 1800;
const CONFETTI_DURATION_VARIATION = 900;
const CONFETTI_DELAY_STEP = 60;

const FIRELY_ALPHA_BASE = 1600;
const FIRELY_ALPHA_VARIATION = 2200;

const SUPER_NOVA_DURATION = 3600;

const SPIRAL_STEP = 10;
const SPIRAL_BASE_RADIUS_RATIO = 0.28;
const SPIRAL_DEFAULT_ARMS = 4;
const SPIRAL_MAX_ARMS = 6;
const SPIRAL_ANGLE_STEP = Math.PI / 28;
const SPIRAL_DRIFT_RANGE = 48;
const SPIRAL_DRIFT_DURATION = 20000;

const WAVE_DURATION = 16000;
const WAVE_AMPLITUDE_RATIO = 0.32;

const AURORA_DURATION = 12000;
const AURORA_SHIFT = 42;

const NEBULA_DURATION = 28000;

function hashString(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 1664525 + value.charCodeAt(index) + 1013904223) & 0xffffffff;
  }

  return hash >>> 0;
}

function randomForKey(key: string, offset = 0) {
  const hash = hashString(`${key}:${offset}`);
  return (hash % 10000) / 10000;
}

type OrbitingUpgradeEmojisProps = {
  emojis: OrbitingEmoji[];
  radius?: number;
  theme?: HomeEmojiTheme;
};

export function OrbitingUpgradeEmojis({
  emojis,
  radius = DEFAULT_RADIUS,
  theme = 'circle',
}: OrbitingUpgradeEmojisProps) {
  const limited = useMemo(() => emojis.slice(0, 96), [emojis]);

  if (limited.length === 0 || theme === 'clear') {
    return null;
  }

  switch (theme) {
    case 'circle':
      return <CircleOrbit emojis={limited} radius={radius} />;
    case 'spiral':
      return <SpiralOrbit emojis={limited} radius={radius} />;
    case 'matrix':
      return <MatrixEmojiRain emojis={limited} radius={radius} variant="matrix" />;
    case 'bubble':
      return <BubbleSwirl emojis={limited} radius={radius} />;
    case 'bubble-pop':
      return <BubblePopBurst emojis={limited} radius={radius} />;
    case 'wave':
      return <WaveRibbon emojis={limited} radius={radius} />;
    case 'echo':
      return <EchoPulse emojis={limited} radius={radius} />;
    case 'confetti':
      return <ConfettiStream emojis={limited} radius={radius} />;
    case 'laser':
      return <LaserSweep emojis={limited} radius={radius} />;
    case 'aurora':
      return <AuroraVeil emojis={limited} radius={radius} />;
    case 'firefly':
      return <FireflyField emojis={limited} radius={radius} />;
    case 'starlight':
      return <StarlightHalo emojis={limited} radius={radius} />;
    case 'nebula':
      return <NebulaSwirl emojis={limited} radius={radius} />;
    case 'supernova':
      return <SupernovaBurst emojis={limited} radius={radius} />;
    default:
      return <CircleOrbit emojis={limited} radius={radius} />;
  }
}

type BasePatternProps = {
  emojis: OrbitingEmoji[];
  radius: number;
};

function useLoopingValue(duration: number, delay = 0, easing: (value: number) => number = Easing.linear) {
  const animated = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    animated.stopAnimation();
    animated.setValue(0);

    const sequence = Animated.sequence([
      Animated.delay(delay),
      Animated.timing(animated, {
        toValue: 1,
        duration,
        easing,
        useNativeDriver: true,
      }),
      Animated.timing(animated, {
        toValue: 0,
        duration: 0,
        useNativeDriver: true,
      }),
    ]);

    const loop = Animated.loop(sequence);
    loop.start();

    return () => {
      loop.stop();
    };
  }, [animated, delay, duration, easing]);

  return animated;
}

function CircleOrbit({ emojis, radius }: BasePatternProps) {
  const rotation = useLoopingValue(12000);
  const rotate = useMemo(
    () =>
      rotation.interpolate({
        inputRange: [0, 1],
        outputRange: ['0rad', `${FULL_ROTATION_RADIANS}rad`],
      }),
    [rotation]
  );

  const positioned = useMemo(() => {
    const limit = emojis.slice(0, 48);
    return limit.map((item, index) => {
      const angle = (FULL_ROTATION_RADIANS * index) / Math.max(1, limit.length);
      return { ...item, angle, distance: radius };
    });
  }, [emojis, radius]);

  return (
    <View pointerEvents="none" style={styles.wrapper}>
      <Animated.View style={[styles.container, { transform: [{ rotate }] }]}> {
        positioned.map(({ id, emoji, angle, distance }) => (
          <View
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
            ]}
          >
            <Text style={styles.emoji}>{emoji}</Text>
          </View>
        ))
      }</Animated.View>
    </View>
  );
}

function SpiralOrbit({ emojis, radius }: BasePatternProps) {
  const rotation = useLoopingValue(16000);
  const drift = useLoopingValue(SPIRAL_DRIFT_DURATION, 0, Easing.inOut(Easing.quad));

  const rotate = useMemo(
    () =>
      rotation.interpolate({
        inputRange: [0, 1],
        outputRange: ['0rad', `${FULL_ROTATION_RADIANS}rad`],
      }),
    [rotation]
  );

  const positioned = useMemo(() => {
    const limit = emojis.slice(0, 72);
    if (limit.length === 0) {
      return [];
    }

    const maxPossibleArms = Math.max(1, Math.min(limit.length, SPIRAL_MAX_ARMS));
    const desiredArms = Math.max(SPIRAL_DEFAULT_ARMS, Math.ceil(limit.length / 6));
    const arms = Math.max(1, Math.min(maxPossibleArms, desiredArms));

    return limit.map((item, index) => {
      const armIndex = index % arms;
      const stepIndex = Math.floor(index / arms);
      const baseDistance = radius * SPIRAL_BASE_RADIUS_RATIO + stepIndex * SPIRAL_STEP;
      const armOffset = armIndex * (SPIRAL_STEP * 0.4);
      const distance = baseDistance + armOffset;
      const angle = (FULL_ROTATION_RADIANS / arms) * armIndex + stepIndex * SPIRAL_ANGLE_STEP;
      return { ...item, angle, distance };
    });
  }, [emojis, radius]);

  if (positioned.length === 0) {
    return null;
  }

  return (
    <View pointerEvents="none" style={styles.wrapper}>
      <Animated.View style={[styles.container, { transform: [{ rotate }] }]}> {
        positioned.map(({ id, emoji, angle, distance }) => {
          const translateTransform = {
            translateX: drift.interpolate({
              inputRange: [0, 1],
              outputRange: [distance, distance + SPIRAL_DRIFT_RANGE],
            }),
          };

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
              ]}
            >
              <Text style={[styles.emoji, styles.emojiSpiral]}>{emoji}</Text>
            </Animated.View>
          );
        })
      }</Animated.View>
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

  useEffect(() => () => {
    dropsRef.current.forEach((drop) => drop.loop.stop());
  }, []);

  useEffect(() => {
    setDrops((prev) => {
      const limited = emojis.slice(0, Math.min(28, emojis.length));
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
      ]}
    >
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
              { transform: [{ translateY: drop.translateY }], left: drop.left },
            ]}
          >
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

  if (MATRIX_COLUMNS <= 1) {
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

function BubbleSwirl({ emojis, radius }: BasePatternProps) {
  const ringConfigs = useMemo(
    () => [
      { radius: radius * 0.55, speed: 18000, scaleFrom: 0.94, scaleTo: 1.08 },
      { radius: radius * 0.82, speed: 22000, scaleFrom: 0.93, scaleTo: 1.05 },
      { radius: radius * 1.12, speed: 28000, scaleFrom: 0.9, scaleTo: 1.03 },
    ],
    [radius]
  );

  const assignments = useMemo(() => {
    const buckets = ringConfigs.map(() => [] as OrbitingEmoji[]);
    const limit = emojis.slice(0, 72);
    limit.forEach((emoji, index) => {
      buckets[index % ringConfigs.length].push(emoji);
    });
    return buckets;
  }, [emojis, ringConfigs]);

  const rotationValues = useMemo(() => ringConfigs.map(() => new Animated.Value(0)), [ringConfigs]);
  const pulseValues = useMemo(() => ringConfigs.map(() => new Animated.Value(0)), [ringConfigs]);

  useEffect(() => {
    const loops = rotationValues.map((value, index) => {
      value.setValue(0);
      const loop = Animated.loop(
        Animated.timing(value, {
          toValue: 1,
          duration: ringConfigs[index].speed,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      loop.start();
      return loop;
    });

    return () => loops.forEach((loop) => loop.stop());
  }, [ringConfigs, rotationValues]);

  useEffect(() => {
    const loops = pulseValues.map((value, index) => {
      value.setValue(0);
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(value, {
            toValue: 1,
            duration: 2400 + index * 500,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0,
            duration: 2400 + index * 500,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
      return loop;
    });

    return () => loops.forEach((loop) => loop.stop());
  }, [pulseValues]);

  return (
    <View pointerEvents="none" style={styles.wrapper}>
      {assignments.map((items, index) => {
        if (items.length === 0) {
          return null;
        }

        const rotate = rotationValues[index].interpolate({
          inputRange: [0, 1],
          outputRange: ['0rad', `${FULL_ROTATION_RADIANS}rad`],
        });

        const scale = pulseValues[index].interpolate({
          inputRange: [0, 1],
          outputRange: [ringConfigs[index].scaleFrom, ringConfigs[index].scaleTo],
        });

        return (
          <Animated.View
            key={`bubble-ring-${index}`}
            style={[
              styles.container,
              { transform: [{ rotate }, { scale }] },
            ]}
          >
            {items.map((item, itemIndex) => {
              const angle = (FULL_ROTATION_RADIANS * itemIndex) / items.length;
              return (
                <View
                  key={item.id}
                  style={[
                    styles.emojiWrapper,
                    {
                      transform: [
                        { rotate: `${angle}rad` },
                        { translateX: ringConfigs[index].radius },
                        { rotate: `${-angle}rad` },
                      ],
                    },
                  ]}
                >
                  <Text style={[styles.emoji, styles.emojiBubble]}>{item.emoji}</Text>
                </View>
              );
            })}
          </Animated.View>
        );
      })}
    </View>
  );
}

function BubblePopBurst({ emojis, radius }: BasePatternProps) {
  const limit = useMemo(() => emojis.slice(0, 48), [emojis]);
  const burstValues = useMemo(() => limit.map((item, index) => ({
    value: new Animated.Value(0),
    delay: Math.floor(randomForKey(item.id, index) * 1600),
    speed: 2000 + Math.floor(randomForKey(item.id, index + 1) * 1800),
  })), [limit]);

  useEffect(() => {
    const loops = burstValues.map(({ value, delay, speed }) => {
      value.setValue(0);
      const loop = Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(value, {
            toValue: 1,
            duration: speed,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0,
            duration: speed,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
      return loop;
    });

    return () => loops.forEach((loop) => loop.stop());
  }, [burstValues]);

  return (
    <View pointerEvents="none" style={styles.wrapper}>
      {limit.map((emoji, index) => {
        const randomDistance = radius * (0.4 + randomForKey(emoji.id, index + 2) * 0.9);
        const angle = FULL_ROTATION_RADIANS * randomForKey(emoji.id, index + 3);
        const burst = burstValues[index];
        const translate = burst.value.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [randomDistance * 0.6, randomDistance, randomDistance * 0.4],
        });
        const scale = burst.value.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0.7, 1.2, 0.8],
        });

        return (
          <Animated.View
            key={emoji.id}
            style={[
              styles.emojiWrapper,
              {
                transform: [
                  { rotate: `${angle}rad` },
                  { translateX: translate },
                  { rotate: `${-angle}rad` },
                  { scale },
                ],
              },
            ]}
          >
            <Text style={[styles.emoji, styles.emojiBubblePop]}>{emoji.emoji}</Text>
          </Animated.View>
        );
      })}
    </View>
  );
}

function WaveRibbon({ emojis, radius }: BasePatternProps) {
  const limit = useMemo(() => emojis.slice(0, 42), [emojis]);
  const wave = useLoopingValue(WAVE_DURATION);
  const width = radius * 2.8;
  const amplitude = radius * WAVE_AMPLITUDE_RATIO;

  const phaseValues = useMemo(
    () => limit.map((item, index) => new Animated.Value(randomForKey(item.id, index + 4))),
    [limit]
  );

  return (
    <View pointerEvents="none" style={styles.wrapper}>
      {limit.map((emoji, index) => {
        const baseX = -width / 2 + (width / Math.max(1, limit.length - 1)) * index;
        const progress = Animated.modulo(Animated.add(wave, phaseValues[index]), 1);
        const translateY = progress.interpolate({
          inputRange: [0, 0.25, 0.5, 0.75, 1],
          outputRange: [0, amplitude, 0, -amplitude, 0],
        });
        const wobble = progress.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0.9, 1.1, 0.9],
        });

        return (
          <Animated.View
            key={emoji.id}
            style={[
              styles.emojiWrapper,
              {
                transform: [
                  { translateX: baseX },
                  { translateY },
                  { scale: wobble },
                ],
              },
            ]}
          >
            <Text style={[styles.emoji, styles.emojiWave]}>{emoji.emoji}</Text>
          </Animated.View>
        );
      })}
    </View>
  );
}

function EchoPulse({ emojis, radius }: BasePatternProps) {
  const rings = useMemo(
    () => [radius * 0.5, radius * 0.85, radius * 1.2],
    [radius]
  );
  const assignments = useMemo(() => {
    const buckets = rings.map(() => [] as OrbitingEmoji[]);
    const limit = emojis.slice(0, 48);
    limit.forEach((emoji, index) => {
      buckets[index % rings.length].push(emoji);
    });
    return buckets;
  }, [emojis, rings]);

  const scaleValues = useMemo(() => rings.map(() => new Animated.Value(0)), [rings]);

  useEffect(() => {
    const loops = scaleValues.map((value, index) => {
      value.setValue(0);
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(value, {
            toValue: 1,
            duration: 2600 + index * 700,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0,
            duration: 2600 + index * 700,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
      return loop;
    });

    return () => loops.forEach((loop) => loop.stop());
  }, [scaleValues]);

  return (
    <View pointerEvents="none" style={styles.wrapper}>
      {assignments.map((items, index) => {
        if (items.length === 0) {
          return null;
        }

        const scale = scaleValues[index].interpolate({
          inputRange: [0, 1],
          outputRange: [0.85, 1.2],
        });

        return (
          <Animated.View
            key={`echo-ring-${index}`}
            style={[styles.container, { transform: [{ scale }] }]}
          >
            {items.map((item, itemIndex) => {
              const angle = (FULL_ROTATION_RADIANS * itemIndex) / items.length;
              return (
                <View
                  key={item.id}
                  style={[
                    styles.emojiWrapper,
                    {
                      transform: [
                        { rotate: `${angle}rad` },
                        { translateX: rings[index] },
                        { rotate: `${-angle}rad` },
                      ],
                    },
                  ]}
                >
                  <Text style={[styles.emoji, styles.emojiEcho]}>{item.emoji}</Text>
                </View>
              );
            })}
          </Animated.View>
        );
      })}
    </View>
  );
}

function ConfettiStream({ emojis, radius }: BasePatternProps) {
  const limit = useMemo(() => emojis.slice(0, 36), [emojis]);
  const streams = useMemo(
    () => limit.map((item, index) => ({
      id: item.id,
      emoji: item.emoji,
      startX: radius * (0.6 - randomForKey(item.id, index + 5) * 1.2),
      startY: -radius * (0.4 + randomForKey(item.id, index + 6)),
      endX: radius * (0.6 - randomForKey(item.id, index + 7) * 1.2) - radius * 0.8,
      endY: radius * (0.9 + randomForKey(item.id, index + 8)),
      delay: Math.floor(randomForKey(item.id, index + 9) * 1600),
      duration: 2600 + Math.floor(randomForKey(item.id, index + 10) * 2200),
    })),
    [limit, radius]
  );

  const animatedValues = useMemo(
    () => streams.map(() => new Animated.Value(0)),
    [streams]
  );

  useEffect(() => {
    const loops = animatedValues.map((value, index) => {
      value.setValue(0);
      const loop = Animated.loop(
        Animated.sequence([
          Animated.delay(streams[index].delay),
          Animated.timing(value, {
            toValue: 1,
            duration: streams[index].duration,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
      return loop;
    });

    return () => loops.forEach((loop) => loop.stop());
  }, [animatedValues, streams]);

  return (
    <View pointerEvents="none" style={styles.wrapper}>
      {streams.map((stream, index) => {
        const progress = animatedValues[index];
        const translateX = progress.interpolate({
          inputRange: [0, 1],
          outputRange: [stream.startX, stream.endX],
        });
        const translateY = progress.interpolate({
          inputRange: [0, 1],
          outputRange: [stream.startY, stream.endY],
        });
        const rotate = progress.interpolate({
          inputRange: [0, 1],
          outputRange: ['-18deg', '12deg'],
        });

        return (
          <Animated.View
            key={stream.id}
            style={[
              styles.emojiWrapper,
              { transform: [{ translateX }, { translateY }, { rotate }] },
            ]}
          >
            <Text style={[styles.emoji, styles.emojiConfetti]}>{stream.emoji}</Text>
          </Animated.View>
        );
      })}
    </View>
  );
}

function LaserSweep({ emojis, radius }: BasePatternProps) {
  const limit = useMemo(() => emojis.slice(0, 54), [emojis]);
  const rotation = useLoopingValue(10000);
  const rotate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0rad', `${FULL_ROTATION_RADIANS}rad`],
  });
  const beamAngles = useMemo(() => [0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4], []);

  const beamAssignments = useMemo(() => {
    const beams = beamAngles.map(() => [] as OrbitingEmoji[]);
    limit.forEach((emoji, index) => {
      beams[index % beamAngles.length].push(emoji);
    });
    return beams;
  }, [beamAngles, limit]);

  return (
    <View pointerEvents="none" style={styles.wrapper}>
      <Animated.View style={[styles.container, { transform: [{ rotate }] }]}> {
        beamAssignments.map((beam, index) => (
          <View key={`laser-beam-${index}`} style={[styles.beamContainer, { transform: [{ rotate: `${beamAngles[index]}rad` }] }]}> {
            beam.map((emoji, emojiIndex) => {
              const distance = radius * (0.4 + emojiIndex * 0.35);
              return (
                <View
                  key={emoji.id}
                  style={[
                    styles.emojiWrapper,
                    {
                      transform: [
                        { translateX: distance },
                      ],
                    },
                  ]}
                >
                  <Text style={[styles.emoji, styles.emojiLaser]}>{emoji.emoji}</Text>
                </View>
              );
            })
          }</View>
        ))
      }</Animated.View>
    </View>
  );
}

function AuroraVeil({ emojis, radius }: BasePatternProps) {
  const columns = useMemo(() => Math.max(2, Math.min(5, Math.ceil(emojis.length / 4))), [emojis.length]);
  const columnWidth = radius * 2.4;
  const segmentHeight = radius * 0.45;
  const limit = useMemo(() => emojis.slice(0, columns * 4), [columns, emojis]);

  const progress = useLoopingValue(AURORA_DURATION, 0, Easing.inOut(Easing.sin));

  return (
    <View pointerEvents="none" style={styles.wrapper}>
      {Array.from({ length: columns }).map((_, columnIndex) => {
        const columnItems = limit.filter((_, index) => index % columns === columnIndex);
        if (columnItems.length === 0) {
          return null;
        }

        const baseX = -columnWidth / 2 + (columnWidth / Math.max(1, columns - 1)) * columnIndex;
        const columnPhase = randomForKey(`aurora-${columnIndex}`, columnIndex + 12);
        const shifted = Animated.modulo(Animated.add(progress, columnPhase), 1);
        const translateY = shifted.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [-AURORA_SHIFT, AURORA_SHIFT, -AURORA_SHIFT],
        });
        const skew = columnIndex % 2 === 0 ? '-6deg' : '6deg';

        return (
          <Animated.View
            key={`aurora-column-${columnIndex}`}
            style={[
              styles.columnContainer,
              {
                transform: [
                  { translateX: baseX },
                  { translateY },
                ],
              },
            ]}
          >
            <View style={[styles.columnInner, { transform: [{ skewY: skew }] }]}> 
              {columnItems.map((emoji, rowIndex) => (
                <View key={emoji.id} style={[styles.columnEmoji, { top: rowIndex * segmentHeight }]}> 
                  <Text style={[styles.emoji, styles.emojiAurora]}>{emoji.emoji}</Text>
                </View>
              ))}
            </View>
          </Animated.View>
        );
      })}
    </View>
  );
}

function FireflyField({ emojis, radius }: BasePatternProps) {
  const limit = useMemo(() => emojis.slice(0, 40), [emojis]);
  const flickers = useMemo(
    () => limit.map((item, index) => ({
      value: new Animated.Value(0),
      duration:
        FIRELY_ALPHA_BASE + Math.floor(randomForKey(item.id, index + 14) * FIRELY_ALPHA_VARIATION),
      offset: Math.floor(randomForKey(item.id, index + 15) * 1800),
    })),
    [limit]
  );

  useEffect(() => {
    const loops = flickers.map(({ value, duration, offset }) => {
      value.setValue(0);
      const loop = Animated.loop(
        Animated.sequence([
          Animated.delay(offset),
          Animated.timing(value, {
            toValue: 1,
            duration,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0,
            duration,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
      return loop;
    });

    return () => loops.forEach((loop) => loop.stop());
  }, [flickers]);

  return (
    <View pointerEvents="none" style={styles.wrapper}>
      {limit.map((emoji, index) => {
        const randomX = radius * (randomForKey(emoji.id, index + 16) * 2 - 1);
        const randomY = radius * (randomForKey(emoji.id, index + 17) * 2 - 1);
        const progress = flickers[index].value;
        const translateX = progress.interpolate({
          inputRange: [0, 1],
          outputRange: [randomX * 0.92, randomX],
        });
        const translateY = progress.interpolate({
          inputRange: [0, 1],
          outputRange: [randomY * 0.92, randomY],
        });
        const opacity = progress.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0.15, 1, 0.2],
        });

        return (
          <Animated.View
            key={emoji.id}
            style={[
              styles.emojiWrapper,
              {
                transform: [{ translateX }, { translateY }],
                opacity,
              },
            ]}
          >
            <Text style={[styles.emoji, styles.emojiFirefly]}>{emoji.emoji}</Text>
          </Animated.View>
        );
      })}
    </View>
  );
}

function StarlightHalo({ emojis, radius }: BasePatternProps) {
  const limit = useMemo(() => emojis.slice(0, 50), [emojis]);
  const rotation = useLoopingValue(20000);
  const rotate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0rad', `${FULL_ROTATION_RADIANS}rad`],
  });

  const points = useMemo(() => {
    const vertices = 5;
    const innerRadius = radius * 0.55;
    const outerRadius = radius * 1.05;
    return Array.from({ length: vertices * 2 }, (_, index) =>
      index % 2 === 0 ? outerRadius : innerRadius
    );
  }, [radius]);

  const placements = useMemo(() => {
    if (limit.length === 0) {
      return [];
    }

    return limit.map((emoji, index) => {
      const pointIndex = index % points.length;
      const radiusForPoint = points[pointIndex];
      const angle = (FULL_ROTATION_RADIANS * index) / points.length;
      return { ...emoji, angle, distance: radiusForPoint };
    });
  }, [limit, points]);

  return (
    <View pointerEvents="none" style={styles.wrapper}>
      <Animated.View style={[styles.container, { transform: [{ rotate }] }]}>
        {placements.map(({ id, emoji, angle, distance }) => (
          <View
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
            ]}
          >
            <Text style={[styles.emoji, styles.emojiStarlight]}>{emoji}</Text>
          </View>
        ))
      }</Animated.View>
    </View>
  );
}

function NebulaSwirl({ emojis, radius }: BasePatternProps) {
  const limit = useMemo(() => emojis.slice(0, 64), [emojis]);
  const rotation = useLoopingValue(NEBULA_DURATION, 0, Easing.inOut(Easing.quad));
  const rotate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0rad', `${FULL_ROTATION_RADIANS}rad`],
  });

  const drift = useLoopingValue(NEBULA_DURATION * 0.8, 0, Easing.inOut(Easing.sin));

  const placements = useMemo(() => {
    return limit.map((emoji, index) => {
      const layer = index % 3;
      const baseRadius = radius * (0.4 + layer * 0.25);
      const wobble = randomForKey(emoji.id, index + 20) * radius * 0.18;
      const distance = baseRadius + wobble;
      const angle = FULL_ROTATION_RADIANS * randomForKey(emoji.id, index + 21);
      return { ...emoji, distance, angle, layer };
    });
  }, [limit, radius]);

  return (
    <View pointerEvents="none" style={styles.wrapper}>
      <Animated.View style={[styles.container, { transform: [{ rotate }] }]}> {
        placements.map(({ id, emoji, distance, angle, layer }) => {
          const translateX = drift.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [distance * 0.9, distance * 1.05, distance * 0.9],
          });
          const scale = 0.9 + layer * 0.06;

          return (
            <Animated.View
              key={id}
              style={[
                styles.emojiWrapper,
                {
                  transform: [
                    { rotate: `${angle}rad` },
                    { translateX },
                    { rotate: `${-angle}rad` },
                    { scale },
                  ],
                },
              ]}
            >
              <Text style={[styles.emoji, styles.emojiNebula]}>{emoji}</Text>
            </Animated.View>
          );
        })
      }</Animated.View>
    </View>
  );
}

function SupernovaBurst({ emojis, radius }: BasePatternProps) {
  const limit = useMemo(() => emojis.slice(0, 40), [emojis]);
  const progress = useLoopingValue(SUPER_NOVA_DURATION, 0, Easing.inOut(Easing.quad));

  return (
    <View pointerEvents="none" style={styles.wrapper}>
      {limit.map((emoji, index) => {
        const angle = FULL_ROTATION_RADIANS * (index / Math.max(1, limit.length));
        const maxDistance = radius * (0.6 + randomForKey(emoji.id, index + 24) * 0.8);
        const translate = progress.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [maxDistance * 0.2, maxDistance, maxDistance * 0.3],
        });
        const scale = progress.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0.6, 1.4, 0.7],
        });

        return (
          <Animated.View
            key={emoji.id}
            style={[
              styles.emojiWrapper,
              {
                transform: [
                  { rotate: `${angle}rad` },
                  { translateX: translate },
                  { rotate: `${-angle}rad` },
                  { scale },
                ],
              },
            ]}
          >
            <Text style={[styles.emoji, styles.emojiSupernova]}>{emoji.emoji}</Text>
          </Animated.View>
        );
      })}
    </View>
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
  emojiEcho: {
    textShadowColor: '#38bdf8',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  emojiConfetti: {
    textShadowColor: '#fed7aa',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 7,
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
  beamContainer: {
    position: 'absolute',
    alignItems: 'flex-start',
  },
  columnContainer: {
    position: 'absolute',
  },
  columnInner: {
    position: 'relative',
  },
  columnEmoji: {
    position: 'absolute',
    left: -13,
  },
});
