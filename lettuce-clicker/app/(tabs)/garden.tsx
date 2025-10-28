import { useState } from 'react';
import {
  Alert,
  GestureResponderEvent,
  LayoutChangeEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EncodingType, documentDirectory, writeAsStringAsync } from 'expo-file-system';

import { useGame } from '@/context/GameContext';

export default function GardenScreen() {
  const {
    harvest,
    emojiCatalog,
    emojiInventory,
    placements,
    purchaseEmoji,
    placeEmoji,
    clearGarden,
  } = useGame();
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 360, height: 360 });

  const handleCanvasPress = (event: GestureResponderEvent) => {
    if (!selectedEmoji) {
      return;
    }

    const { locationX, locationY } = event.nativeEvent;
    const placed = placeEmoji(selectedEmoji, { x: locationX, y: locationY });

    if (!placed) {
      Alert.alert('Out of stock', 'Purchase more of this emoji to keep decorating!');
    }
  };

  const handleSaveGarden = async () => {
    try {
      const { width, height } = canvasSize;
      const svgBody = placements
        .map((placement) => {
          const emoji = emojiCatalog.find((item) => item.id === placement.emojiId);
          if (!emoji) {
            return '';
          }

          return `<text x="${placement.x}" y="${placement.y}" font-size="32" text-anchor="middle" dominant-baseline="middle">${emoji.emoji}</text>`;
        })
        .join('');

      const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#ffffff" />${svgBody}</svg>`;

      if (!documentDirectory) {
        Alert.alert('Save failed', 'Storage directory unavailable.');
        return;
      }

      const destination = `${documentDirectory}lettuce-garden-${Date.now()}.svg`;
      await writeAsStringAsync(destination, svg, {
        encoding: EncodingType.UTF8,
      });

      Alert.alert('Garden saved', `SVG image exported to\n${destination}`);
    } catch {
      Alert.alert('Save failed', 'Something went wrong while saving your garden.');
    }
  };

  const handleCanvasLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setCanvasSize({ width, height });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.harvestBanner}>
          <Text style={styles.harvestTitle}>Garden Atelier</Text>
          <Text style={styles.harvestAmount}>{harvest.toLocaleString()} harvest ready</Text>
          <Text style={styles.harvestHint}>
            Purchase decorations with harvest, select one, then tap the canvas to place it.
          </Text>
        </View>

        <View style={styles.shopContainer}>
          {emojiCatalog.map((item) => {
            const owned = emojiInventory[item.id] ?? 0;
            const isSelected = selectedEmoji === item.id;

            const handlePurchase = () => {
              const success = purchaseEmoji(item.id);

              if (!success) {
                Alert.alert('Not enough harvest', 'Gather more lettuce to purchase this decoration.');
                return;
              }

              setSelectedEmoji(item.id);
            };
            return (
              <View key={item.id} style={[styles.emojiCard, isSelected && styles.emojiCardSelected]}>
                <Pressable style={styles.selectionArea} onPress={() => setSelectedEmoji(item.id)}>
                  <Text style={styles.emojiGlyph}>{item.emoji}</Text>
                  <Text style={styles.emojiName}>{item.name}</Text>
                  <Text style={styles.emojiOwned}>Owned: {owned}</Text>
                  {isSelected && <Text style={styles.selectedPill}>Selected</Text>}
                </Pressable>
                <Pressable
                  accessibilityLabel={`Purchase ${item.name}`}
                  onPress={handlePurchase}
                  style={styles.purchaseButton}>
                  <Text style={styles.purchaseButtonText}>Buy for {item.cost}</Text>
                </Pressable>
              </View>
            );
          })}
        </View>

        <Pressable style={styles.canvas} onPress={handleCanvasPress} onLayout={handleCanvasLayout}>
          {placements.map((placement) => {
            const emoji = emojiCatalog.find((item) => item.id === placement.emojiId);
            if (!emoji) {
              return null;
            }

            return (
              <Text
                key={placement.id}
                style={[
                  styles.canvasEmoji,
                  {
                    left: placement.x - 16,
                    top: placement.y - 16,
                  },
                ]}>
                {emoji.emoji}
              </Text>
            );
          })}
        </Pressable>

        <View style={styles.canvasActions}>
          <Pressable style={styles.secondaryButton} onPress={clearGarden}>
            <Text style={styles.secondaryText}>Clear Garden</Text>
          </Pressable>
          <Pressable style={styles.primaryButton} onPress={handleSaveGarden}>
            <Text style={styles.primaryText}>Save Image</Text>
          </Pressable>
        </View>
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
  harvestBanner: {
    backgroundColor: '#22543d',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 4,
  },
  harvestTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f0fff4',
  },
  harvestAmount: {
    fontSize: 24,
    fontWeight: '800',
    color: '#c6f6d5',
    marginTop: 8,
  },
  harvestHint: {
    marginTop: 12,
    color: '#e6fffa',
    fontSize: 14,
    lineHeight: 20,
  },
  shopContainer: {
    gap: 12,
  },
  emojiCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    shadowColor: '#22543d',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 3,
    gap: 12,
  },
  emojiCardSelected: {
    borderWidth: 2,
    borderColor: '#38a169',
  },
  selectionArea: {
    alignItems: 'center',
    gap: 6,
  },
  emojiGlyph: {
    fontSize: 44,
  },
  emojiName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#22543d',
  },
  emojiOwned: {
    fontSize: 14,
    color: '#2f855a',
  },
  selectedPill: {
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#c6f6d5',
    color: '#22543d',
    fontWeight: '700',
    fontSize: 12,
  },
  purchaseButton: {
    backgroundColor: '#2f855a',
    paddingVertical: 10,
    borderRadius: 12,
  },
  purchaseButtonText: {
    color: '#f0fff4',
    fontWeight: '700',
    textAlign: 'center',
    fontSize: 15,
  },
  canvas: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    height: 360,
    position: 'relative',
    shadowColor: '#22543d',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 6,
  },
  canvasEmoji: {
    position: 'absolute',
    fontSize: 32,
  },
  canvasActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#e6fffa',
    borderRadius: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#81e6d9',
  },
  secondaryText: {
    textAlign: 'center',
    color: '#22543d',
    fontWeight: '600',
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#22543d',
    borderRadius: 14,
    paddingVertical: 12,
  },
  primaryText: {
    textAlign: 'center',
    color: '#f0fff4',
    fontWeight: '700',
  },
});
