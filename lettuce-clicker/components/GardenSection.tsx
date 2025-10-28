import { useState } from 'react';
import { Alert, GestureResponderEvent, Pressable, StyleSheet, Text, View } from 'react-native';

import { EmojiDefinition, Placement } from '@/context/GameContext';

type Props = {
  harvest: number;
  emojiCatalog: EmojiDefinition[];
  emojiInventory: Record<string, number>;
  placements: Placement[];
  purchaseEmoji: (emojiId: string) => boolean;
  placeEmoji: (emojiId: string, position: { x: number; y: number }) => boolean;
  clearGarden: () => void;
  title?: string;
};

export function GardenSection({
  harvest,
  emojiCatalog,
  emojiInventory,
  placements,
  purchaseEmoji,
  placeEmoji,
  clearGarden,
  title = 'Garden Atelier',
}: Props) {
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);

  const handleCanvasPress = (event: GestureResponderEvent) => {
    if (!selectedEmoji) {
      return;
    }

    const available = emojiInventory[selectedEmoji] ?? 0;

    if (available <= 0) {
      Alert.alert('Out of stock', 'Purchase more of this emoji to keep decorating!');
      setSelectedEmoji(null);
      return;
    }

    const { locationX, locationY } = event.nativeEvent;
    const placed = placeEmoji(selectedEmoji, { x: locationX, y: locationY });

    if (!placed) {
      Alert.alert('Out of stock', 'Purchase more of this emoji to keep decorating!');
      setSelectedEmoji(null);
      return;
    }

    if (available === 1) {
      setSelectedEmoji(null);
    }
  };

  const handleSelect = (emojiId: string, owned: number) => {
    if (owned <= 0) {
      Alert.alert('Purchase required', 'Buy this decoration before placing it in the garden.');
      return;
    }

    setSelectedEmoji(emojiId);
  };

  const handlePurchase = (emojiId: string) => {
    const success = purchaseEmoji(emojiId);

    if (!success) {
      Alert.alert('Not enough harvest', 'Gather more lettuce to purchase this decoration.');
      return;
    }

    setSelectedEmoji(emojiId);
  };

  const handleClearGarden = () => {
    clearGarden();
    setSelectedEmoji(null);
  };

  const handleSaveSnapshot = () => {
    Alert.alert(
      'Save your garden',
      'Use your device\'s screenshot tools to capture the garden canvas once you finish decorating.'
    );
  };

  return (
    <View style={styles.section}>
      <View style={styles.harvestBanner}>
        <Text style={styles.harvestTitle}>{title}</Text>
        <Text style={styles.harvestAmount}>{harvest.toLocaleString()} harvest ready</Text>
        <Text style={styles.harvestHint}>
          Purchase decorations with harvest, select one, then tap the canvas to place it.
        </Text>
      </View>

      <View style={styles.shopContainer}>
        {emojiCatalog.map((item) => {
          const owned = emojiInventory[item.id] ?? 0;
          const isSelected = selectedEmoji === item.id;
          const isOutOfStock = owned === 0;

          return (
            <View
              key={item.id}
              style={[
                styles.emojiCard,
                isSelected && styles.emojiCardSelected,
                isOutOfStock && styles.emojiCardOutOfStock,
              ]}>
              <Pressable style={styles.selectionArea} onPress={() => handleSelect(item.id, owned)}>
                <Text style={styles.emojiGlyph}>{item.emoji}</Text>
                <Text style={styles.emojiName}>{item.name}</Text>
                <Text style={styles.emojiOwned}>Owned: {owned}</Text>
                {isOutOfStock && <Text style={styles.outOfStock}>Purchase to place</Text>}
                {isSelected && <Text style={styles.selectedPill}>Selected</Text>}
              </Pressable>
              <Pressable
                accessibilityLabel={`Purchase ${item.name}`}
                onPress={() => handlePurchase(item.id)}
                style={styles.purchaseButton}>
                <Text style={styles.purchaseButtonText}>Buy for {item.cost.toLocaleString()}</Text>
              </Pressable>
            </View>
          );
        })}
      </View>

      <Pressable style={styles.canvas} onPress={handleCanvasPress}>
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
        <Pressable
          style={[styles.secondaryButton, placements.length === 0 && styles.disabledSecondary]}
          disabled={placements.length === 0}
          onPress={handleClearGarden}>
          <Text style={[styles.secondaryText, placements.length === 0 && styles.disabledText]}>Clear Garden</Text>
        </Pressable>
        <Pressable style={styles.primaryButton} onPress={handleSaveSnapshot}>
          <Text style={styles.primaryText}>Save Snapshot</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
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
  },
  emojiCardSelected: {
    borderWidth: 2,
    borderColor: '#38a169',
  },
  emojiCardOutOfStock: {
    opacity: 0.7,
  },
  selectionArea: {
    alignItems: 'center',
    gap: 10,
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
  outOfStock: {
    fontSize: 12,
    color: '#c05621',
    fontWeight: '600',
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
    alignSelf: 'stretch',
    alignItems: 'center',
    marginTop: 12,
  },
  purchaseButtonText: {
    color: '#f0fff4',
    fontWeight: '700',
    fontSize: 15,
    textAlign: 'center',
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
    overflow: 'hidden',
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
  disabledSecondary: {
    opacity: 0.6,
  },
  disabledText: {
    color: '#718096',
  },
});
