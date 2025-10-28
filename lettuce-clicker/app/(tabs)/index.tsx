import { SafeAreaView } from 'react-native-safe-area-context';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { GardenSection } from '@/components/GardenSection';
import { OrbitingUpgradeEmojis } from '@/components/OrbitingUpgradeEmojis';
import { UpgradeSection } from '@/components/UpgradeSection';
import { useGame } from '@/context/GameContext';

export default function HomeScreen() {
  const {
    harvest,
    lifetimeHarvest,
    autoPerSecond,
    addHarvest,
    upgrades,
    purchasedUpgrades,
    purchaseUpgrade,
    orbitingUpgradeEmojis,
    emojiCatalog,
    emojiInventory,
    placements,
    purchaseEmoji,
    placeEmoji,
    clearGarden,
  } = useGame();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerText}>🥬 Lettuce Park Gardens</Text>
        </View>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator
          alwaysBounceVertical
        >
          <Text style={styles.title}>Lettuce Click</Text>
          <View style={styles.lettuceWrapper}>
            <OrbitingUpgradeEmojis emojis={orbitingUpgradeEmojis} />
            <Pressable
              accessibilityLabel="Harvest lettuce"
              onPress={addHarvest}
              style={({ pressed }) => [styles.lettuceButton, pressed && styles.lettucePressed]}>
              <View style={styles.circleOuter} />
              <View style={styles.circleInner} />
              <View style={styles.circleHighlight} />
              <Text style={styles.lettuceEmoji}>🥬</Text>
            </Pressable>
          </View>

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
              <Text style={styles.statLabel}>Auto clicks /s</Text>
              <Text style={styles.statValue}>{autoPerSecond.toLocaleString()}</Text>
            </View>
          </View>

          <View style={styles.callouts}>
            <Text style={styles.calloutTitle}>Grow your park</Text>
            <Text style={styles.calloutCopy}>
              Spend harvest on upgrades to unlock faster auto clicks and stronger tap values. Scroll
              down to plant emoji friends in the garden studio and capture your masterpiece once it is
              ready.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Upgrade Market</Text>
            <UpgradeSection
              harvest={harvest}
              autoPerSecond={autoPerSecond}
              upgrades={upgrades}
              purchasedUpgrades={purchasedUpgrades}
              purchaseUpgrade={purchaseUpgrade}
              title="Conservatory Upgrades"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Garden Studio</Text>
            <GardenSection
              harvest={harvest}
              emojiCatalog={emojiCatalog}
              emojiInventory={emojiInventory}
              placements={placements}
              purchaseEmoji={purchaseEmoji}
              placeEmoji={placeEmoji}
              clearGarden={clearGarden}
              title="Garden Atelier"
            />
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#2f855a',
  },
  container: {
    flex: 1,
    backgroundColor: '#f2f9f2',
  },
  header: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: '#2f855a',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 6,
  },
  headerText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f7fbea',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 160,
    gap: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#2f855a',
    textAlign: 'center',
  },
  lettuceWrapper: {
    alignSelf: 'center',
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lettuceButton: {
    width: '100%',
    height: '100%',
    borderRadius: 110,
    backgroundColor: '#f9fff7',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#2f855a',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  lettucePressed: {
    transform: [{ scale: 0.96 }],
  },
  circleOuter: {
    position: 'absolute',
    width: 204,
    height: 204,
    borderRadius: 102,
    backgroundColor: '#d8f5dd',
    borderWidth: 2,
    borderColor: '#b7ebc3',
  },
  circleInner: {
    position: 'absolute',
    width: 156,
    height: 156,
    borderRadius: 78,
    backgroundColor: 'rgba(56, 161, 105, 0.28)',
  },
  circleHighlight: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(240, 255, 244, 0.55)',
  },
  lettuceEmoji: {
    fontSize: 72,
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
  section: {
    gap: 16,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '700',
    color: '#22543d',
  },
});
