import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';

import { GardenSection } from '@/components/GardenSection';
import { useGame } from '@/context/GameContext';

export default function GardenScreen() {
  const {
    harvest,
    emojiCatalog,
    emojiInventory,
    inventoryOrder,
    placements,
    purchaseEmoji,
    placeEmoji,
    updatePlacement,
    clearGarden,
    registerCustomEmoji,
    reorderInventory,
  } = useGame();

  return (
    <SafeAreaView style={styles.safeArea}>
      <GardenSection
        harvest={harvest}
        emojiCatalog={emojiCatalog}
        emojiInventory={emojiInventory}
        inventoryOrder={inventoryOrder}
        placements={placements}
        purchaseEmoji={purchaseEmoji}
        placeEmoji={placeEmoji}
        updatePlacement={updatePlacement}
        clearGarden={clearGarden}
        registerCustomEmoji={registerCustomEmoji}
        reorderInventory={reorderInventory}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f2f9f2',
  },
});
