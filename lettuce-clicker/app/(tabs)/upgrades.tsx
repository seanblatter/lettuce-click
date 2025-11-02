import { useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, StyleSheet } from 'react-native';

import { UpgradeSection } from '@/components/UpgradeSection';
import { useGame } from '@/context/GameContext';

export default function UpgradesScreen() {
  const {
    harvest,
    autoPerSecond,
    upgrades,
    purchasedUpgrades,
    purchaseUpgrade,
    emojiThemes,
    ownedThemes,
    purchaseEmojiTheme,
    homeEmojiTheme,
    setHomeEmojiTheme,
    gardenBackgroundColor,
  } = useGame();
  const surfaceColor = useMemo(
    () =>
      gardenBackgroundColor && gardenBackgroundColor.trim().length > 0
        ? gardenBackgroundColor
        : '#f0fff4',
    [gardenBackgroundColor]
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: surfaceColor }]}>
      <ScrollView
        style={[styles.scroll, { backgroundColor: surfaceColor }]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator
        alwaysBounceVertical
      >
        <UpgradeSection
          harvest={harvest}
          autoPerSecond={autoPerSecond}
          upgrades={upgrades}
          purchasedUpgrades={purchasedUpgrades}
          purchaseUpgrade={purchaseUpgrade}
          emojiThemes={emojiThemes}
          ownedThemes={ownedThemes}
          purchaseEmojiTheme={purchaseEmojiTheme}
          homeEmojiTheme={homeEmojiTheme}
          setHomeEmojiTheme={setHomeEmojiTheme}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f0fff4',
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingBottom: 80,
    gap: 20,
  },
});
