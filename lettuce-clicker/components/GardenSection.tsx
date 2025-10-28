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

      <View style={styles.shopGrid}>
        {emojiCatalog.map((item) => {
          const owned = emojiInventory[item.id] ?? 0;
          const isSelected = selectedEmoji === item.id;
          const isOutOfStock = owned === 0;
          const canAfford = harvest >= item.cost;

          return (
            <View key={item.id} style={styles.emojiCell}>
              <Pressable
                style={[
                  styles.emojiSlot,
                  isSelected && styles.emojiSlotSelected,
                  isOutOfStock && styles.emojiSlotEmpty,
                ]}
                onPress={() => handleSelect(item.id, owned)}>
                <Text style={styles.emojiGlyph}>{item.emoji}</Text>
                <View style={styles.ownedBadge}>
                  <Text style={styles.ownedBadgeText}>x{owned}</Text>
                </View>
                {isSelected && <Text style={styles.selectedBadge}>Selected</Text>}
              </Pressable>
              <Text style={styles.emojiName}>{item.name}</Text>
              <Pressable
                accessibilityLabel={`Purchase ${item.name}`}
                onPress={() => handlePurchase(item.id)}
                disabled={!canAfford}
                style={[styles.purchaseButton, !canAfford && styles.purchaseButtonDisabled]}>
                <Text style={[styles.purchaseButtonText, !canAfford && styles.purchaseButtonTextDisabled]}>
                  Buy {item.cost.toLocaleString()}
                </Text>
              </Pressable>
              {isOutOfStock && <Text style={styles.outOfStock}>Purchase to place</Text>}
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
  shopGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-between',
  },
  emojiCell: {
    width: '30%',
    minWidth: 96,
    alignItems: 'center',
    gap: 8,
  },
  emojiSlot: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 18,
    backgroundColor: '#f7fafc',
    borderWidth: 2,
    borderColor: '#cbd5e0',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  emojiSlotSelected: {
    borderColor: '#38a169',
    backgroundColor: '#c6f6d5',
  },
  emojiSlotEmpty: {
    opacity: 0.85,
  },
  emojiGlyph: {
    fontSize: 40,
  },
  ownedBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(34, 84, 61, 0.85)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  ownedBadgeText: {
    color: '#f0fff4',
    fontSize: 12,
    fontWeight: '700',
  },
  selectedBadge: {
    position: 'absolute',
    bottom: 6,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: '#22543d',
  },
  emojiName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#22543d',
    textAlign: 'center',
  },
  purchaseButton: {
    backgroundColor: '#2f855a',
    paddingVertical: 8,
    borderRadius: 12,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  purchaseButtonDisabled: {
    backgroundColor: '#cbd5e0',
  },
  purchaseButtonText: {
    color: '#f0fff4',
    fontWeight: '700',
    fontSize: 13,
    textAlign: 'center',
  },
  purchaseButtonTextDisabled: {
    color: '#4a5568',
  },
  outOfStock: {
    fontSize: 11,
    color: '#c05621',
    fontWeight: '600',
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
