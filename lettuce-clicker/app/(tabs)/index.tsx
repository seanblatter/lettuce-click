import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useGame } from '@/context/GameContext';

export default function HomeScreen() {
  const { harvest, lifetimeHarvest, autoPerSecond, tapValue, addHarvest } = useGame();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 18 }]}>
          <Text style={styles.headerText}>🥬Lettuce Park Gardens</Text>
        </View>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Lettuce Click</Text>
          <Pressable
            accessibilityLabel="Harvest lettuce"
            onPress={addHarvest}
            style={({ pressed }) => [styles.lettuceButton, pressed && styles.lettucePressed]}>
            <View style={styles.circleGlow} />
            <View style={styles.circleOuter} />
            <View style={styles.circleInner} />
            <View style={styles.circleHighlight} />
            <Text style={styles.lettuceEmoji}>🥬</Text>
            <Text style={styles.tapHint}>Tap to harvest</Text>
          </Pressable>

          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>Harvest Ledger</Text>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Available harvest</Text>
              <Text style={styles.statValue}>{harvest.toLocaleString()}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Lifetime harvest</Text>
              <Text style={styles.statValue}>{lifetimeHarvest.toLocaleString()}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Auto speed (per second)</Text>
              <Text style={styles.statValue}>{autoPerSecond.toLocaleString()}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Click value</Text>
              <Text style={styles.statValue}>{tapValue.toLocaleString()}</Text>
            </View>
          </View>

          <View style={styles.callouts}>
            <Text style={styles.calloutTitle}>Grow your park</Text>
            <Text style={styles.calloutCopy}>
              Spend harvest on upgrades to unlock faster auto clicks and stronger tap values. Visit the
              Garden tab to plant emoji friends and capture your masterpiece once it is ready.
            </Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f2f9f2',
  },
  container: {
    flex: 1,
  },
  header: {
    paddingBottom: 20,
    paddingHorizontal: 24,
    backgroundColor: '#0d7a42',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 6,
  },
  headerText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f2ffe8',
  },
  content: {
    padding: 24,
    paddingBottom: 120,
    flexGrow: 1,
    gap: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#2f855a',
    textAlign: 'center',
  },
  lettuceButton: {
    alignSelf: 'center',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#0d7a42',
    shadowOpacity: 0.28,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 16 },
    elevation: 12,
  },
  lettucePressed: {
    transform: [{ scale: 0.96 }],
  },
  circleGlow: {
    position: 'absolute',
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: 'rgba(13, 122, 66, 0.15)',
    opacity: 0.8,
  },
  circleOuter: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(67, 160, 71, 0.28)',
  },
  circleInner: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(56, 142, 60, 0.35)',
  },
  circleHighlight: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(250, 255, 250, 0.55)',
    top: 46,
    left: 50,
  },
  lettuceEmoji: {
    fontSize: 72,
  },
  tapHint: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#2f855a',
  },
  statsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 4,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#22543d',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statLabel: {
    fontSize: 16,
    color: '#2d3748',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#22543d',
  },
  callouts: {
    backgroundColor: '#e6fffa',
    borderRadius: 20,
    padding: 18,
    gap: 6,
    borderColor: '#81e6d9',
    borderWidth: 1,
  },
  calloutTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#285e61',
  },
  calloutCopy: {
    fontSize: 15,
    color: '#234e52',
    lineHeight: 20,
  },
});
