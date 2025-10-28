import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text } from 'react-native';

const FULL_ROTATION_RADIANS = Math.PI * 2;
const DEFAULT_RADIUS = 120;

type OrbitingUpgradeEmojisProps = {
  emojis: string[];
  radius?: number;
};

export function OrbitingUpgradeEmojis({ emojis, radius = DEFAULT_RADIUS }: OrbitingUpgradeEmojisProps) {
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (emojis.length === 0) {
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
  }, [emojis.length, rotation]);

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

    return emojis.map((emoji, index) => ({
      emoji,
      angle: (FULL_ROTATION_RADIANS * index) / emojis.length,
      key: `${emoji}-${index}`,
    }));
  }, [emojis]);

  if (positioned.length === 0) {
    return null;
  }

  return (
    <Animated.View pointerEvents="none" style={[styles.container, { transform: [{ rotate }] }]}>
      {positioned.map(({ emoji, angle, key }) => (
        <Animated.View
          key={key}
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
  );
}

const styles = StyleSheet.create({
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
});
