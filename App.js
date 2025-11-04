import React, { useMemo, useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

const UPGRADE_DEFS = [
  {
    id: 'sprout-sprinter',
    name: 'Sprout Sprinter',
    threshold: 10,
    cost: 10,
    bonus: 1,
    description: 'Adds 1 auto click per second. Perfect for getting started.',
  },
  {
    id: 'garden-gears',
    name: 'Garden Gears',
    threshold: 100,
    cost: 120,
    bonus: 5,
    description: 'Mechanical helpers add 5 clicks per second.',
  },
  {
    id: 'watering-wave',
    name: 'Watering Wave',
    threshold: 1000,
    cost: 1500,
    bonus: 20,
    description: 'Irrigation magic trickles in 20 clicks each second.',
  },
  {
    id: 'fertile-field',
    name: 'Fertile Field',
    threshold: 10000,
    cost: 18000,
    bonus: 75,
    description: 'The soil hums with 75 extra clicks every second.',
  },
  {
    id: 'pollinator-party',
    name: 'Pollinator Party',
    threshold: 100000,
    cost: 220000,
    bonus: 250,
    description: 'Helpful bees bring 250 clicks each second.',
  },
  {
    id: 'solar-surge',
    name: 'Solar Surge',
    threshold: 1000000,
    cost: 2600000,
    bonus: 1000,
    description: 'Sun-powered lettuce adds 1,000 clicks per second.',
  },
  {
    id: 'windmill-whirl',
    name: 'Windmill Whirl',
    threshold: 10000000,
    cost: 30000000,
    bonus: 4000,
    description: 'Wind energy spins up 4,000 clicks every second.',
  },
  {
    id: 'hydro-harmony',
    name: 'Hydro Harmony',
    threshold: 100000000,
    cost: 350000000,
    bonus: 15000,
    description: 'Water wheels splash in 15,000 clicks per second.',
  },
  {
    id: 'quantum-grove',
    name: 'Quantum Grove',
    threshold: 1000000000,
    cost: 4000000000,
    bonus: 60000,
    description: 'Time-bending lettuce gives 60,000 clicks per second.',
  },
];

const PLANT_OPTIONS = [
  { id: 'sprout', name: 'Sprout', emoji: '🌱', cost: 15 },
  { id: 'tulip', name: 'Tulip', emoji: '🌷', cost: 60 },
  { id: 'rose', name: 'Rose', emoji: '🌹', cost: 250 },
  { id: 'sunflower', name: 'Sunflower', emoji: '🌻', cost: 750 },
  { id: 'evergreen', name: 'Evergreen', emoji: '🌲', cost: 2000 },
  { id: 'palm', name: 'Palm', emoji: '🌴', cost: 5000 },
  { id: 'herbs', name: 'Herb Patch', emoji: '🪴', cost: 9000 },
];

export default function App() {
  const [clicks, setClicks] = useState(0);
  const [totalClicks, setTotalClicks] = useState(0);
  const [autoClickRate, setAutoClickRate] = useState(0); // clicks per second
  const [purchasedUpgrades, setPurchasedUpgrades] = useState([]);
  const [gardenPlants, setGardenPlants] = useState([]);

  useEffect(() => {
    if (autoClickRate <= 0) {
      return;
    }
    const interval = setInterval(() => {
      const increment = autoClickRate / 10; // distribute by 0.1 second slices
      setClicks((prev) => prev + increment);
      setTotalClicks((prev) => prev + increment);
    }, 100);

    return () => clearInterval(interval);
  }, [autoClickRate]);

  const handleManualClick = () => {
    setClicks((prev) => prev + 1);
    setTotalClicks((prev) => prev + 1);
  };

  const handlePurchaseUpgrade = (upgrade) => {
    if (purchasedUpgrades.includes(upgrade.id)) {
      return;
    }
    if (clicks < upgrade.cost) {
      return;
    }

    setClicks((prev) => prev - upgrade.cost);
    setAutoClickRate((prev) => prev + upgrade.bonus);
    setPurchasedUpgrades((prev) => [...prev, upgrade.id]);
  };

  const handleBuyPlant = (plant) => {
    if (clicks < plant.cost) {
      return;
    }
    const stampedPlant = {
      ...plant,
      instanceId: `${plant.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    };
    setClicks((prev) => prev - plant.cost);
    setGardenPlants((prev) => [...prev, stampedPlant]);
  };

  const availableUpgrades = useMemo(() => {
    return UPGRADE_DEFS.map((upgrade) => {
      const unlocked = totalClicks >= upgrade.threshold;
      const purchased = purchasedUpgrades.includes(upgrade.id);
      const affordable = clicks >= upgrade.cost;
      return { ...upgrade, unlocked, purchased, affordable };
    });
  }, [clicks, totalClicks, purchasedUpgrades]);

  const formattedClicks = useMemo(() => clicks.toFixed(1), [clicks]);
  const formattedTotal = useMemo(() => totalClicks.toFixed(1), [totalClicks]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>🥬 Lettuce Click Garden</Text>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Clicks</Text>
            <Text style={styles.statValue}>{formattedClicks}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Total Earned</Text>
            <Text style={styles.statValue}>{formattedTotal}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Auto Clicks</Text>
            <Text style={styles.statValue}>{autoClickRate.toFixed(1)} / sec</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.clickButton} onPress={handleManualClick}>
          <Text style={styles.clickEmoji}>🥬</Text>
          <Text style={styles.clickHint}>Tap the lettuce to earn clicks!</Text>
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Speed Upgrades</Text>
          <Text style={styles.sectionSubtitle}>
            Reach milestone totals to unlock automatic lettuce helpers. Each upgrade adds to
            your clicks every 0.1 seconds.
          </Text>
          {availableUpgrades.map((upgrade) => (
            <View
              key={upgrade.id}
              style={[
                styles.upgradeRow,
                upgrade.purchased && styles.upgradePurchased,
                !upgrade.unlocked && styles.upgradeLocked,
              ]}
            >
              <View style={styles.upgradeInfo}>
                <Text style={styles.upgradeName}>{upgrade.name}</Text>
                <Text style={styles.upgradeDescription}>{upgrade.description}</Text>
                <Text style={styles.upgradeMeta}>
                  Unlocks at {upgrade.threshold.toLocaleString()} clicks · Cost: {upgrade.cost.toLocaleString()}
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.upgradeButton,
                  upgrade.purchased && styles.upgradeButtonPurchased,
                  (!upgrade.affordable || !upgrade.unlocked || upgrade.purchased) && styles.upgradeButtonDisabled,
                ]}
                onPress={() => handlePurchaseUpgrade(upgrade)}
                disabled={!upgrade.affordable || !upgrade.unlocked || upgrade.purchased}
              >
                <Text style={styles.upgradeButtonText}>
                  {upgrade.purchased ? 'Owned' : `+${upgrade.bonus}/sec`}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Garden Shop</Text>
          <Text style={styles.sectionSubtitle}>
            Spend your clicks on plants and decorate the garden. Each purchase places a plant in the garden area below.
          </Text>
          <View style={styles.plantGrid}>
            {PLANT_OPTIONS.map((plant) => {
              const affordable = clicks >= plant.cost;
              return (
                <TouchableOpacity
                  key={plant.id}
                  style={[styles.plantCard, !affordable && styles.plantCardDisabled]}
                  onPress={() => handleBuyPlant(plant)}
                  disabled={!affordable}
                >
                  <Text style={styles.plantEmoji}>{plant.emoji}</Text>
                  <Text style={styles.plantName}>{plant.name}</Text>
                  <Text style={styles.plantCost}>{plant.cost.toLocaleString()} clicks</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Garden</Text>
          <Text style={styles.sectionSubtitle}>
            Arrange your collection of plant emojis. Keep clicking to grow your lettuce empire!
          </Text>
          <View style={styles.gardenArea}>
            {gardenPlants.length === 0 ? (
              <Text style={styles.emptyGardenText}>No plants yet. Buy some from the shop!</Text>
            ) : (
              gardenPlants.map((plant) => (
                <Text key={plant.instanceId} style={styles.gardenPlant}>
                  {plant.emoji}
                </Text>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    padding: 24,
    paddingBottom: 72,
    gap: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    color: '#2f855a',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  statBox: {
    flexBasis: '30%',
    minWidth: 110,
    backgroundColor: '#f0fff4',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#c6f6d5',
  },
  statLabel: {
    fontSize: 14,
    color: '#276749',
    fontWeight: '600',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    color: '#22543d',
    fontWeight: '700',
  },
  clickButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fefcbf',
    borderRadius: 24,
    paddingVertical: 24,
    borderWidth: 2,
    borderColor: '#faf089',
  },
  clickEmoji: {
    fontSize: 64,
  },
  clickHint: {
    marginTop: 8,
    fontSize: 16,
    color: '#744210',
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#f7fafc',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2d3748',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#4a5568',
    lineHeight: 20,
  },
  upgradeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    padding: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#edf2f7',
    marginBottom: 12,
  },
  upgradeInfo: {
    flex: 1,
    paddingRight: 12,
  },
  upgradeName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2f855a',
  },
  upgradeDescription: {
    fontSize: 14,
    color: '#4a5568',
    marginTop: 4,
  },
  upgradeMeta: {
    marginTop: 8,
    fontSize: 12,
    color: '#718096',
  },
  upgradeButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#48bb78',
  },
  upgradeButtonText: {
    color: '#f0fff4',
    fontWeight: '700',
  },
  upgradeButtonDisabled: {
    backgroundColor: '#cbd5e0',
  },
  upgradeButtonPurchased: {
    backgroundColor: '#68d391',
  },
  upgradePurchased: {
    borderColor: '#c6f6d5',
    backgroundColor: '#f0fff4',
  },
  upgradeLocked: {
    opacity: 0.6,
  },
  plantGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  plantCard: {
    width: '30%',
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#cbd5e0',
  },
  plantCardDisabled: {
    opacity: 0.4,
  },
  plantEmoji: {
    fontSize: 36,
  },
  plantName: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: '600',
    color: '#2d3748',
  },
  plantCost: {
    marginTop: 4,
    fontSize: 12,
    color: '#718096',
  },
  gardenArea: {
    minHeight: 160,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#cbd5e0',
    backgroundColor: '#ffffff',
    padding: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gardenPlant: {
    fontSize: 36,
  },
  emptyGardenText: {
    fontSize: 14,
    color: '#718096',
  },
});
