import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, StyleSheet } from 'react-native';

import { GardenSection } from '@/components/GardenSection';
import { useGame } from '@/context/GameContext';

export default function GardenScreen() {
  const {
    harvest,
    emojiCatalog,
    emojiInventory,
    placements,
    purchaseEmoji,
    placeEmoji,
    updatePlacement,
    clearGarden,
    drawings,
    addDrawingStroke,
    clearDrawings,
  } = useGame();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator
        alwaysBounceVertical
      >
        <GardenSection
          harvest={harvest}
          emojiCatalog={emojiCatalog}
          emojiInventory={emojiInventory}
          placements={placements}
          purchaseEmoji={purchaseEmoji}
          placeEmoji={placeEmoji}
          updatePlacement={updatePlacement}
          clearGarden={clearGarden}
          drawings={drawings}
          addDrawingStroke={addDrawingStroke}
          clearDrawings={clearDrawings}
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
    paddingBottom: 120,
    gap: 28,
  },
});
