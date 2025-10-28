import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, StyleSheet } from 'react-native';

import { UpgradeSection } from '@/components/UpgradeSection';
import { useGame } from '@/context/GameContext';

export default function UpgradesScreen() {
  const { harvest, autoPerSecond, tapValue, upgrades, purchasedUpgrades, purchaseUpgrade } = useGame();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <UpgradeSection
          harvest={harvest}
          autoPerSecond={autoPerSecond}
          tapValue={tapValue}
          upgrades={upgrades}
          purchasedUpgrades={purchasedUpgrades}
          purchaseUpgrade={purchaseUpgrade}
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
  content: {
    padding: 24,
    paddingBottom: 80,
    gap: 20,
  },
});
