import { SafeAreaView } from 'react-native-safe-area-context';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useGame } from '@/context/GameContext';

export default function UpgradesScreen() {
  const { harvest, autoPerSecond, tapValue, upgrades, purchasedUpgrades, purchaseUpgrade } = useGame();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Conservatory Upgrades</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Available harvest</Text>
            <Text style={styles.summaryValue}>{harvest.toLocaleString()}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Auto harvest /s</Text>
            <Text style={styles.summaryValue}>{autoPerSecond.toLocaleString()}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tap value</Text>
            <Text style={styles.summaryValue}>{tapValue.toLocaleString()}</Text>
          </View>
        </View>

        {upgrades.map((upgrade) => {
          const owned = purchasedUpgrades[upgrade.id] ?? 0;
          const canAfford = harvest >= upgrade.cost;
          return (
            <View key={upgrade.id} style={styles.upgradeCard}>
              <View style={styles.upgradeHeader}>
                <Text style={styles.upgradeTitle}>{upgrade.name}</Text>
                <Text style={styles.upgradeCost}>{upgrade.cost.toLocaleString()} harvest</Text>
              </View>
              <Text style={styles.upgradeDescription}>{upgrade.description}</Text>
              <Text style={styles.upgradeOwned}>Owned: {owned}</Text>
              <Pressable
                accessibilityLabel={`Purchase ${upgrade.name}`}
                disabled={!canAfford}
                onPress={() => purchaseUpgrade(upgrade.id)}
                style={[styles.upgradeButton, !canAfford && styles.upgradeButtonDisabled]}>
                <Text style={styles.upgradeButtonText}>
                  {canAfford ? 'Purchase upgrade' : 'Need more harvest'}
                </Text>
              </Pressable>
            </View>
          );
        })}
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
  summaryCard: {
    backgroundColor: '#22543d',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 4,
    gap: 12,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#c6f6d5',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    color: '#e6fffa',
    fontSize: 15,
  },
  summaryValue: {
    color: '#f0fff4',
    fontWeight: '700',
    fontSize: 18,
  },
  upgradeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
    shadowColor: '#2f855a',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 3,
    gap: 10,
  },
  upgradeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  upgradeTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a4731',
  },
  upgradeCost: {
    fontSize: 15,
    fontWeight: '600',
    color: '#276749',
  },
  upgradeDescription: {
    fontSize: 14,
    color: '#2d3748',
    lineHeight: 20,
  },
  upgradeOwned: {
    fontSize: 13,
    color: '#4a5568',
  },
  upgradeButton: {
    marginTop: 4,
    backgroundColor: '#22543d',
    paddingVertical: 10,
    borderRadius: 12,
  },
  upgradeButtonDisabled: {
    backgroundColor: '#cbd5e0',
  },
  upgradeButtonText: {
    color: '#f0fff4',
    textAlign: 'center',
    fontWeight: '700',
  },
});
