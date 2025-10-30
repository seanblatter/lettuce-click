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
const WAVE_PHASES = [0, 0.25, 0.5, 0.75, 1];
const WAVE_COLUMNS = 6;
const WAVE_ROW_SPACING = 38;
const WAVE_COLUMN_SPACING = 52;
const CONFETTI_MAX_EMOJIS = 32;
const FIREFLY_MIN_EMOJIS = 16;
const FIREFLY_MAX_EMOJIS = 40;

const WINDOW = Dimensions.get('window');
const WINDOW_WIDTH = WINDOW.width;
const WINDOW_HEIGHT = WINDOW.height;
const MATRIX_EXTRA_SPREAD = 220;
const MATRIX_WIDTH = WINDOW_WIDTH + MATRIX_EXTRA_SPREAD;
const MATRIX_HEIGHT = WINDOW_HEIGHT * 1.6;
const MATRIX_START_Y = -WINDOW_HEIGHT * 0.6;
const MATRIX_END_Y = WINDOW_HEIGHT + 160;
const MATRIX_EMOJI_SIZE = 26;

const pseudoRandom = (seed: number) => {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

const rotateArray = (values: number[], offset: number) =>
  values.map((_, index) => values[(index + offset) % values.length]);

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

  if (theme === 'confetti') {
    return <ConfettiEmojiBurst emojis={emojis} radius={radius} />;
  }

  if (theme === 'laser') {
    return <LaserSweep emojis={emojis} />;
  }

  if (theme === 'wave' || theme === 'aurora') {
    return <WaveEmojiField emojis={emojis} radius={radius} variant={theme} />;
  }

  if (theme === 'firefly') {
    return <FireflySwarm emojis={emojis} radius={radius} />;
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
  const spiralDrift = useRef(new Animated.Value(0)).current;
  const spiralLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  const bubblePulse = useRef(new Animated.Value(0)).current;

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
    spiralLoopRef.current?.stop();

    if (theme !== 'spiral' || emojis.length === 0) {
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

  useEffect(() => {
    if (theme !== 'bubble' && theme !== 'bubble-pop') {
      bubblePulse.stopAnimation();
      bubblePulse.setValue(0);
      return;
    }

    bubblePulse.setValue(0);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bubblePulse, {
          toValue: 1,
          duration: theme === 'bubble-pop' ? 2200 : 2800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(bubblePulse, {
          toValue: 0,
          duration: theme === 'bubble-pop' ? 2200 : 2800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    loop.start();

    return () => {
      loop.stop();
    };
  }, [bubblePulse, theme]);

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

        return { ...item, angle, distance, scale: 1 };
      });
    }

    if (theme === 'bubble') {
      return limit.map((item, index) => {
        const angle = (FULL_ROTATION_RADIANS * index) / limit.length;
        const wobble = 0.88 + 0.12 * Math.sin(index * 0.9);
        return { ...item, angle, distance: radius * wobble, scale: 0.9 + 0.08 * Math.cos(index * 1.1) };
      });
    }

    if (theme === 'bubble-pop') {
      return limit.map((item, index) => {
        const angle = (FULL_ROTATION_RADIANS * index) / limit.length;
        const jitter = 0.7 + pseudoRandom(index + 1) * 0.6;
        const scale = 0.75 + pseudoRandom(index + 19) * 0.6;
        return { ...item, angle, distance: radius * jitter, scale };
      });
    }

    if (theme === 'echo') {
      return limit.map((item, index) => {
        const angle = (FULL_ROTATION_RADIANS * index) / limit.length;
        const layer = index % 3;
        const distance = radius * (0.62 + layer * 0.18);
        const scale = 0.8 + layer * 0.12;
        return { ...item, angle, distance, scale };
      });
    }

    return limit.map((item, index) => {
      const angle = (FULL_ROTATION_RADIANS * index) / limit.length;
      return { ...item, angle, distance: radius, scale: 1 };
    });
  }, [emojis, radius, theme]);

  if (positioned.length === 0) {
    return null;
  }

  const bubbleScale = useMemo(
    () =>
      bubblePulse.interpolate({
        inputRange: [0, 1],
        outputRange: [0.94, 1.06],
      }),
    [bubblePulse]
  );

  const containerStyle =
    theme === 'bubble' || theme === 'bubble-pop'
      ? [styles.container, { transform: [{ rotate }, { scale: bubbleScale }] }]
      : [styles.container, { transform: [{ rotate }] }];

  return (
    <View pointerEvents="none" style={styles.wrapper}>
      <Animated.View style={containerStyle}>
        {positioned.map(({ id, emoji, angle, distance, scale }) => {
          const translateTransform =
            theme === 'spiral'
              ? {
                  translateX: spiralDrift.interpolate({
                    inputRange: [0, 1],
                    outputRange: [distance, distance + SPIRAL_DRIFT_RANGE],
                  }),
                }
              : { translateX: distance };

          const transforms: Animated.AnimatedTransform = [
            { rotate: `${angle}rad` },
            translateTransform,
            { rotate: `${-angle}rad` },
          ];

          if (typeof scale === 'number' && Math.abs(scale - 1) > 0.02) {
            transforms.push({ scale });
          }

          return (
            <Animated.View key={id} style={[styles.emojiWrapper, { transform: transforms }]}>
              <Text
                style={[
                  styles.emoji,
                  theme === 'spiral' && styles.emojiSpiral,
                  (theme === 'bubble' || theme === 'bubble-pop') && styles.emojiBubble,
                  theme === 'echo' && styles.emojiEcho,
                ]}
              >
                {emoji}
              </Text>
            </Animated.View>
          );
        })}
      </Animated.View>
    </View>
  );
}

type WaveEmojiFieldProps = {
  emojis: OrbitingEmoji[];
  radius: number;
  variant: 'wave' | 'aurora';
};

function WaveEmojiField({ emojis, radius, variant }: WaveEmojiFieldProps) {
  const wavePhase = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    wavePhase.setValue(0);
    const loop = Animated.loop(
      Animated.timing(wavePhase, {
        toValue: 1,
        duration: variant === 'aurora' ? 18000 : 12000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    loop.start();

    return () => {
      loop.stop();
    };
  }, [variant, wavePhase]);

  const waveItems = useMemo(() => {
    const limit = emojis.slice(0, WAVE_COLUMNS * 4);
    return limit.map((item, index) => {
      const column = index % WAVE_COLUMNS;
      const row = Math.floor(index / WAVE_COLUMNS);
      const amplitudeBase = variant === 'aurora' ? 26 : 18;
      const amplitude = amplitudeBase + row * 6;
      const offset = (column + row) % WAVE_PHASES.length;
      const baseX = (column - (WAVE_COLUMNS - 1) / 2) * WAVE_COLUMN_SPACING;
      const baseY = (row - 1) * WAVE_ROW_SPACING;
      return { ...item, amplitude, offset, baseX, baseY };
    });
  }, [emojis, variant]);

  const horizontalSway = useMemo(
    () =>
      wavePhase.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [-24, 24, -24],
      }),
    [wavePhase]
  );

  const auroraOpacity = useMemo(
    () =>
      wavePhase.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0.45, 0.9, 0.45],
      }),
    [wavePhase]
  );

  const fieldWidth = radius * 2 + 160;
  const fieldHeight = radius + 200;
  const halfWidth = fieldWidth / 2;
  const halfHeight = fieldHeight / 2;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.waveWrapper,
        { width: fieldWidth, height: fieldHeight, transform: [{ translateX: horizontalSway }] },
      ]}
    >
      {waveItems.map((item, index) => {
        const translateY = wavePhase.interpolate({
          inputRange: WAVE_PHASES,
          outputRange: rotateArray([0, item.amplitude, 0, -item.amplitude, 0], item.offset),
        });

        return (
          <Animated.View
            key={`${item.id}-wave-${index}`}
            style={[
              styles.waveEmojiWrapper,
              { left: halfWidth + item.baseX, top: halfHeight + item.baseY },
            ]}
          >
            <Animated.View
              style={[
                styles.waveEmoji,
                {
                  transform: [{ translateY }],
                  opacity: variant === 'aurora' ? auroraOpacity : 1,
                },
              ]}
            >
              <Text
                style={[
                  styles.waveEmojiText,
                  variant === 'aurora' && styles.auroraEmojiText,
                ]}
              >
                {item.emoji}
              </Text>
            </Animated.View>
          </Animated.View>
        );
      })}
    </Animated.View>
  );
}

type ConfettiEmojiBurstProps = {
  emojis: OrbitingEmoji[];
  radius: number;
};

type ConfettiParticle = {
  id: string;
  emoji: string;
  animated: Animated.Value;
  translateY: Animated.AnimatedInterpolation<string | number>;
  translateX: Animated.AnimatedInterpolation<string | number>;
  rotate: Animated.AnimatedInterpolation<string | number>;
  opacity: Animated.AnimatedInterpolation<number>;
  loop: Animated.CompositeAnimation;
};

function ConfettiEmojiBurst({ emojis, radius }: ConfettiEmojiBurstProps) {
  const [particles, setParticles] = useState<ConfettiParticle[]>([]);
  const particlesRef = useRef<ConfettiParticle[]>([]);

  useEffect(() => {
    return () => {
      particlesRef.current.forEach((particle) => particle.loop.stop());
    };
  }, []);

  useEffect(() => {
    particlesRef.current.forEach((particle) => particle.loop.stop());

    const limit = emojis.slice(0, Math.min(CONFETTI_MAX_EMOJIS, Math.max(12, emojis.length * 2)));
    const created = limit.map((item, index) => {
      const animated = new Animated.Value(0);
      const duration = 3600 + pseudoRandom(index + 3) * 1800;
      const delay = pseudoRandom(index + 7) * 800;
      const translateY = animated.interpolate({
        inputRange: [0, 1],
        outputRange: [-radius - 120, radius + 220],
      });
      const drift = pseudoRandom(index + 11) * 2 - 1;
      const translateX = animated.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [drift * -30, drift * 80, drift * -40],
      });
      const rotate = animated.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: ['0deg', `${drift * 360}deg`, '360deg'],
      });
      const opacity = animated.interpolate({
        inputRange: [0, 0.1, 0.9, 1],
        outputRange: [0, 1, 1, 0],
      });
      const loop = Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animated, {
            toValue: 1,
            duration,
            easing: Easing.inOut(Easing.quad),
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
      return {
        id: `${item.id}-confetti-${index}`,
        emoji: item.emoji,
        animated,
        translateY,
        translateX,
        rotate,
        opacity,
        loop,
      };
    });

    particlesRef.current = created;
    setParticles(created);

    return () => {
      created.forEach((particle) => particle.loop.stop());
    };
  }, [emojis, radius]);

  if (particles.length === 0) {
    return null;
  }

  return (
    <View
      pointerEvents="none"
      style={[styles.confettiWrapper, { width: radius * 2 + 200, height: radius * 2 + 240 }]}
    >
      {particles.map((particle) => (
        <Animated.View
          key={particle.id}
          style={[
            styles.confettiParticle,
            {
              transform: [
                { translateX: particle.translateX },
                { translateY: particle.translateY },
                { rotate: particle.rotate },
              ],
              opacity: particle.opacity,
            },
          ]}
        >
          <Text style={styles.confettiEmoji}>{particle.emoji}</Text>
        </Animated.View>
      ))}
    </View>
  );
}

type LaserSweepProps = {
  emojis: OrbitingEmoji[];
};

function LaserSweep({ emojis }: LaserSweepProps) {
  const sweep = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    sweep.setValue(0);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(sweep, {
          toValue: 1,
          duration: 5200,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(sweep, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );

    loop.start();

    return () => {
      loop.stop();
    };
  }, [sweep, emojis.length]);

  const beamOpacity = useMemo(
    () =>
      sweep.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0.25, 0.9, 0.25],
      }),
    [sweep]
  );

  const offset = useMemo(
    () =>
      sweep.interpolate({
        inputRange: [0, 1],
        outputRange: [-160, 160],
      }),
    [sweep]
  );

  const lineEmojis = useMemo(() => {
    const base = emojis.length > 0 ? emojis : [{ id: 'laser', emoji: '✨' }];
    const limit = Math.min(26, Math.max(12, base.length * 2));
    return Array.from({ length: limit }, (_, index) => {
      const source = base[index % base.length];
      return { id: `${source.id}-laser-${index}`, emoji: source.emoji };
    });
  }, [emojis]);

  return (
    <View pointerEvents="none" style={styles.laserWrapper}>
      <Animated.View style={[styles.laserBeam, { opacity: beamOpacity }]} />
      <Animated.View style={[styles.laserStream, { transform: [{ translateX: offset }] }]}>
        {lineEmojis.map((item) => (
          <Text key={item.id} style={styles.laserEmoji}>
            {item.emoji}
          </Text>
        ))}
      </Animated.View>
    </View>
  );
}

type FireflySwarmProps = {
  emojis: OrbitingEmoji[];
  radius: number;
};

type FireflyParticle = {
  id: string;
  emoji: string;
  x: number;
  y: number;
  scale: number;
  opacity: Animated.AnimatedInterpolation<number>;
  animated: Animated.Value;
  loop: Animated.CompositeAnimation;
};

function FireflySwarm({ emojis, radius }: FireflySwarmProps) {
  const [particles, setParticles] = useState<FireflyParticle[]>([]);
  const particlesRef = useRef<FireflyParticle[]>([]);

  useEffect(() => {
    return () => {
      particlesRef.current.forEach((particle) => particle.loop.stop());
    };
  }, []);

  useEffect(() => {
    particlesRef.current.forEach((particle) => particle.loop.stop());

    const base = emojis.length > 0 ? emojis : [{ id: 'firefly', emoji: '✨' }];
    const limit = Math.min(FIREFLY_MAX_EMOJIS, Math.max(FIREFLY_MIN_EMOJIS, base.length * 3));
    const created: FireflyParticle[] = Array.from({ length: limit }, (_, index) => {
      const source = base[index % base.length];
      const animated = new Animated.Value(0);
      const angle = FULL_ROTATION_RADIANS * pseudoRandom(index + 13);
      const distance = radius * (0.4 + pseudoRandom(index + 21) * 0.6);
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;
      const scale = 0.7 + pseudoRandom(index + 5) * 0.6;
      const flickerDuration = 2200 + pseudoRandom(index + 9) * 2500;
      const flickerDelay = pseudoRandom(index + 17) * 1800;

      const loop = Animated.loop(
        Animated.sequence([
          Animated.delay(flickerDelay),
          Animated.timing(animated, {
            toValue: 1,
            duration: flickerDuration,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(animated, {
            toValue: 0,
            duration: flickerDuration,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();

      const opacity = animated.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0.2, 0.9, 0.2],
      });

      return {
        id: `${source.id}-firefly-${index}`,
        emoji: source.emoji,
        x,
        y,
        scale,
        opacity,
        animated,
        loop,
      };
    });

    particlesRef.current = created;
    setParticles(created);

    return () => {
      created.forEach((particle) => particle.loop.stop());
    };
  }, [emojis, radius]);

  if (particles.length === 0) {
    return null;
  }

  const size = radius * 2 + 200;

  return (
    <View pointerEvents="none" style={[styles.fireflyWrapper, { width: size, height: size }]}>
      {particles.map((particle) => (
        <Animated.View
          key={particle.id}
          style={[
            styles.fireflyParticle,
            {
              transform: [
                { translateX: particle.x },
                { translateY: particle.y },
                { scale: particle.scale },
              ],
              opacity: particle.opacity,
            },
          ]}
        >
          <Text style={styles.fireflyEmoji}>{particle.emoji}</Text>
        </Animated.View>
      ))}
    </View>
  );
}


type WaveEmojiFieldProps = {
  emojis: OrbitingEmoji[];
  radius: number;
  variant: 'wave' | 'aurora';
};

function WaveEmojiField({ emojis, radius, variant }: WaveEmojiFieldProps) {
  const wavePhase = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    wavePhase.setValue(0);
    const loop = Animated.loop(
      Animated.timing(wavePhase, {
        toValue: 1,
        duration: variant === 'aurora' ? 18000 : 12000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    loop.start();

    return () => {
      loop.stop();
    };
  }, [variant, wavePhase]);

  const waveItems = useMemo(() => {
    const limit = emojis.slice(0, WAVE_COLUMNS * 4);
    return limit.map((item, index) => {
      const column = index % WAVE_COLUMNS;
      const row = Math.floor(index / WAVE_COLUMNS);
      const amplitudeBase = variant === 'aurora' ? 26 : 18;
      const amplitude = amplitudeBase + row * 6;
      const offset = (column + row) % WAVE_PHASES.length;
      const baseX = (column - (WAVE_COLUMNS - 1) / 2) * WAVE_COLUMN_SPACING;
      const baseY = (row - 1) * WAVE_ROW_SPACING;
      return { ...item, amplitude, offset, baseX, baseY };
    });
  }, [emojis, variant]);

  const horizontalSway = useMemo(
    () =>
      wavePhase.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [-24, 24, -24],
      }),
    [wavePhase]
  );

  const auroraOpacity = useMemo(
    () =>
      wavePhase.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0.45, 0.9, 0.45],
      }),
    [wavePhase]
  );

  const fieldWidth = radius * 2 + 160;
  const fieldHeight = radius + 200;
  const halfWidth = fieldWidth / 2;
  const halfHeight = fieldHeight / 2;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.waveWrapper,
        { width: fieldWidth, height: fieldHeight, transform: [{ translateX: horizontalSway }] },
      ]}
    >
      {waveItems.map((item, index) => {
        const translateY = wavePhase.interpolate({
          inputRange: WAVE_PHASES,
          outputRange: rotateArray([0, item.amplitude, 0, -item.amplitude, 0], item.offset),
        });

        return (
          <Animated.View
            key={`${item.id}-wave-${index}`}
            style={[
              styles.waveEmojiWrapper,
              { left: halfWidth + item.baseX, top: halfHeight + item.baseY },
            ]}
          >
            <Animated.View
              style={[
                styles.waveEmoji,
                {
                  transform: [{ translateY }],
                  opacity: variant === 'aurora' ? auroraOpacity : 1,
                },
              ]}
            >
              <Text
                style={[
                  styles.waveEmojiText,
                  variant === 'aurora' && styles.auroraEmojiText,
                ]}
              >
                {item.emoji}
              </Text>
            </Animated.View>
          </Animated.View>
        );
      })}
    </Animated.View>
  );
}

type ConfettiEmojiBurstProps = {
  emojis: OrbitingEmoji[];
  radius: number;
};

type ConfettiParticle = {
  id: string;
  emoji: string;
  animated: Animated.Value;
  translateY: Animated.AnimatedInterpolation<string | number>;
  translateX: Animated.AnimatedInterpolation<string | number>;
  rotate: Animated.AnimatedInterpolation<string | number>;
  opacity: Animated.AnimatedInterpolation<number>;
  loop: Animated.CompositeAnimation;
};

function ConfettiEmojiBurst({ emojis, radius }: ConfettiEmojiBurstProps) {
  const [particles, setParticles] = useState<ConfettiParticle[]>([]);
  const particlesRef = useRef<ConfettiParticle[]>([]);

  useEffect(() => {
    return () => {
      particlesRef.current.forEach((particle) => particle.loop.stop());
    };
  }, []);

  useEffect(() => {
    particlesRef.current.forEach((particle) => particle.loop.stop());

    const limit = emojis.slice(0, Math.min(CONFETTI_MAX_EMOJIS, Math.max(12, emojis.length * 2)));
    const created = limit.map((item, index) => {
      const animated = new Animated.Value(0);
      const duration = 3600 + pseudoRandom(index + 3) * 1800;
      const delay = pseudoRandom(index + 7) * 800;
      const translateY = animated.interpolate({
        inputRange: [0, 1],
        outputRange: [-radius - 120, radius + 220],
      });
      const drift = pseudoRandom(index + 11) * 2 - 1;
      const translateX = animated.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [drift * -30, drift * 80, drift * -40],
      });
      const rotate = animated.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: ['0deg', `${drift * 360}deg`, '360deg'],
      });
      const opacity = animated.interpolate({
        inputRange: [0, 0.1, 0.9, 1],
        outputRange: [0, 1, 1, 0],
      });
      const loop = Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animated, {
            toValue: 1,
            duration,
            easing: Easing.inOut(Easing.quad),
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
      return {
        id: `${item.id}-confetti-${index}`,
        emoji: item.emoji,
        animated,
        translateY,
        translateX,
        rotate,
        opacity,
        loop,
      };
    });

    particlesRef.current = created;
    setParticles(created);

    return () => {
      created.forEach((particle) => particle.loop.stop());
    };
  }, [emojis, radius]);

  if (particles.length === 0) {
    return null;
  }

  return (
    <View
      pointerEvents="none"
      style={[styles.confettiWrapper, { width: radius * 2 + 200, height: radius * 2 + 240 }]}
    >
      {particles.map((particle) => (
        <Animated.View
          key={particle.id}
          style={[
            styles.confettiParticle,
            {
              transform: [
                { translateX: particle.translateX },
                { translateY: particle.translateY },
                { rotate: particle.rotate },
              ],
              opacity: particle.opacity,
            },
          ]}
        >
          <Text style={styles.confettiEmoji}>{particle.emoji}</Text>
        </Animated.View>
      ))}
    </View>
  );
}

type LaserSweepProps = {
  emojis: OrbitingEmoji[];
};

function LaserSweep({ emojis }: LaserSweepProps) {
  const sweep = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    sweep.setValue(0);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(sweep, {
          toValue: 1,
          duration: 5200,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(sweep, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );

    loop.start();

    return () => {
      loop.stop();
    };
  }, [sweep, emojis.length]);

  const beamOpacity = useMemo(
    () =>
      sweep.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0.25, 0.9, 0.25],
      }),
    [sweep]
  );

  const offset = useMemo(
    () =>
      sweep.interpolate({
        inputRange: [0, 1],
        outputRange: [-160, 160],
      }),
    [sweep]
  );

  const lineEmojis = useMemo(() => {
    const base = emojis.length > 0 ? emojis : [{ id: 'laser', emoji: '✨' }];
    const limit = Math.min(26, Math.max(12, base.length * 2));
    return Array.from({ length: limit }, (_, index) => {
      const source = base[index % base.length];
      return { id: `${source.id}-laser-${index}`, emoji: source.emoji };
    });
  }, [emojis]);

  return (
    <View pointerEvents="none" style={styles.laserWrapper}>
      <Animated.View style={[styles.laserBeam, { opacity: beamOpacity }]} />
      <Animated.View style={[styles.laserStream, { transform: [{ translateX: offset }] }]}>
        {lineEmojis.map((item) => (
          <Text key={item.id} style={styles.laserEmoji}>
            {item.emoji}
          </Text>
        ))}
      </Animated.View>
    </View>
  );
}

type FireflySwarmProps = {
  emojis: OrbitingEmoji[];
  radius: number;
};

type FireflyParticle = {
  id: string;
  emoji: string;
  x: number;
  y: number;
  scale: number;
  opacity: Animated.AnimatedInterpolation<number>;
  animated: Animated.Value;
  loop: Animated.CompositeAnimation;
};

function FireflySwarm({ emojis, radius }: FireflySwarmProps) {
  const [particles, setParticles] = useState<FireflyParticle[]>([]);
  const particlesRef = useRef<FireflyParticle[]>([]);

  useEffect(() => {
    return () => {
      particlesRef.current.forEach((particle) => particle.loop.stop());
    };
  }, []);

  useEffect(() => {
    particlesRef.current.forEach((particle) => particle.loop.stop());

    const base = emojis.length > 0 ? emojis : [{ id: 'firefly', emoji: '✨' }];
    const limit = Math.min(FIREFLY_MAX_EMOJIS, Math.max(FIREFLY_MIN_EMOJIS, base.length * 3));
    const created: FireflyParticle[] = Array.from({ length: limit }, (_, index) => {
      const source = base[index % base.length];
      const animated = new Animated.Value(0);
      const angle = FULL_ROTATION_RADIANS * pseudoRandom(index + 13);
      const distance = radius * (0.4 + pseudoRandom(index + 21) * 0.6);
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;
      const scale = 0.7 + pseudoRandom(index + 5) * 0.6;
      const flickerDuration = 2200 + pseudoRandom(index + 9) * 2500;
      const flickerDelay = pseudoRandom(index + 17) * 1800;

      const loop = Animated.loop(
        Animated.sequence([
          Animated.delay(flickerDelay),
          Animated.timing(animated, {
            toValue: 1,
            duration: flickerDuration,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(animated, {
            toValue: 0,
            duration: flickerDuration,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();

      const opacity = animated.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0.2, 0.9, 0.2],
      });

      return {
        id: `${source.id}-firefly-${index}`,
        emoji: source.emoji,
        x,
        y,
        scale,
        opacity,
        animated,
        loop,
      };
    });

    particlesRef.current = created;
    setParticles(created);

    return () => {
      created.forEach((particle) => particle.loop.stop());
    };
  }, [emojis, radius]);

  if (particles.length === 0) {
    return null;
  }

  const size = radius * 2 + 200;

  return (
    <View pointerEvents="none" style={[styles.fireflyWrapper, { width: size, height: size }]}>
      {particles.map((particle) => (
        <Animated.View
          key={particle.id}
          style={[
            styles.fireflyParticle,
            {
              transform: [
                { translateX: particle.x },
                { translateY: particle.y },
                { scale: particle.scale },
              ],
              opacity: particle.opacity,
            },
          ]}
        >
          <Text style={styles.fireflyEmoji}>{particle.emoji}</Text>
        </Animated.View>
      ))}
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
const MATRIX_COLUMNS = 7;
const MATRIX_DURATION_BASE = 2800;
const MATRIX_DURATION_VARIATION = 1200;
const MATRIX_DELAY_STEP = 90;

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
  emojiBubble: {
    fontSize: 28,
    textShadowColor: 'rgba(59, 130, 246, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  emojiEcho: {
    fontSize: 24,
    opacity: 0.85,
  },
  waveWrapper: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  waveEmojiWrapper: {
    position: 'absolute',
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waveEmoji: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  waveEmojiText: {
    fontSize: 24,
  },
  auroraEmojiText: {
    fontSize: 26,
    color: '#c4b5fd',
    textShadowColor: 'rgba(124, 58, 237, 0.45)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 12,
  },
  confettiWrapper: {
    position: 'absolute',
    overflow: 'hidden',
    alignItems: 'center',
  },
  confettiParticle: {
    position: 'absolute',
  },
  confettiEmoji: {
    fontSize: 22,
  },
  laserWrapper: {
    position: 'absolute',
    width: '100%',
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  laserBeam: {
    position: 'absolute',
    width: '110%',
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(56, 189, 248, 0.25)',
  },
  laserStream: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  laserEmoji: {
    fontSize: 28,
    color: '#fefcbf',
    marginHorizontal: 4,
    textShadowColor: 'rgba(59, 130, 246, 0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  fireflyWrapper: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fireflyParticle: {
    position: 'absolute',
  },
  fireflyEmoji: {
    fontSize: 20,
    color: '#fef3c7',
    textShadowColor: 'rgba(250, 204, 21, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
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
