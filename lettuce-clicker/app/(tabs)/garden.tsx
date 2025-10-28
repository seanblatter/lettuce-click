import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, StyleSheet } from 'react-native';

import { GardenSection } from '@/components/GardenSection';
import { useGame } from '@/context/GameContext';

export default function GardenScreen() {
  const { harvest, emojiCatalog, emojiInventory, placements, purchaseEmoji, placeEmoji, clearGarden } = useGame();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <GardenSection
          harvest={harvest}
          emojiCatalog={emojiCatalog}
          emojiInventory={emojiInventory}
          placements={placements}
          purchaseEmoji={purchaseEmoji}
          placeEmoji={placeEmoji}
          clearGarden={clearGarden}
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
    gap: 24,
  },
});
