import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { UpgradeSection } from '@/components/UpgradeSection';
import { ThemeShopSection } from '@/components/ThemeShopSection';
import { useGame } from '@/context/GameContext';

export default function UpgradesScreen() {
  const {
    harvest,
    autoPerSecond,
    upgrades,
    purchasedUpgrades,
    purchaseUpgrade,
    themes,
    purchasedThemes,
    homeEmojiTheme,
    purchaseTheme,
    setHomeEmojiTheme,
  } = useGame();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator
        alwaysBounceVertical
      >
        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>Conservatory Atelier</Text>
          <Text style={styles.heroCopy}>
            Fortify your garden engines with precision tools and unlock new ways to spotlight your orbiting emoji
            friends. Balance automation upgrades with fresh themes to keep guests dazzled.
          </Text>
        </View>
        <UpgradeSection
          harvest={harvest}
          autoPerSecond={autoPerSecond}
          upgrades={upgrades}
          purchasedUpgrades={purchasedUpgrades}
          purchaseUpgrade={purchaseUpgrade}
        />
        <ThemeShopSection
          harvest={harvest}
          homeEmojiTheme={homeEmojiTheme}
          themes={themes}
          purchasedThemes={purchasedThemes}
          purchaseTheme={purchaseTheme}
          setHomeEmojiTheme={setHomeEmojiTheme}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f2f9f2',
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingBottom: 80,
    gap: 24,
  },
  heroCard: {
    backgroundColor: '#1f6f4a',
    padding: 22,
    borderRadius: 24,
    shadowColor: '#0f172a',
    shadowOpacity: 0.14,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 4,
    gap: 12,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#f0fff4',
  },
  heroCopy: {
    fontSize: 15,
    lineHeight: 22,
    color: '#e6fffa',
  },
});
