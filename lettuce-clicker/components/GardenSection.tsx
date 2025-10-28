import { useEffect, useMemo, useState } from 'react';
import { Alert, GestureResponderEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import { EmojiDefinition, Placement } from '@/context/GameContext';

type Props = {
  harvest: number;
  emojiCatalog: EmojiDefinition[];
  emojiInventory: Record<string, number>;
  placements: Placement[];
  purchaseEmoji: (emojiId: string) => boolean;
  placeEmoji: (emojiId: string, position: { x: number; y: number }) => boolean;
  updatePlacement: (placementId: string, updates: Partial<Placement>) => void;
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
  updatePlacement,
  clearGarden,
  title = 'Garden Atelier',
}: Props) {
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<'shop' | 'inventory'>('shop');

  const inventoryList = useMemo(
    () =>
      emojiCatalog
        .map((item) => ({
          ...item,
          owned: emojiInventory[item.id] ?? 0,
        }))
        .sort((a, b) => a.cost - b.cost),
    [emojiCatalog, emojiInventory]
  );

  const ownedInventory = inventoryList.filter((item) => item.owned > 0);

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
      "Use your device's screenshot tools to capture the garden canvas once you finish decorating."
    );
  };

  return (
    <View style={styles.section}>
      <View style={styles.harvestBanner}>
        <Text style={styles.harvestTitle}>{title}</Text>
        <Text style={styles.harvestAmount}>{harvest.toLocaleString()} harvest ready</Text>
        <Text style={styles.harvestHint}>
          Purchase decorations in the shop, then switch to your inventory to tap the canvas and place
          them.
        </Text>
      </View>

      <View style={styles.panelTabs}>
        <Pressable
          style={[styles.tabButton, activePanel === 'shop' && styles.tabButtonActive]}
          onPress={() => setActivePanel('shop')}>
          <Text style={[styles.tabButtonText, activePanel === 'shop' && styles.tabButtonTextActive]}>Shop</Text>
        </Pressable>
        <Pressable
          style={[styles.tabButton, activePanel === 'inventory' && styles.tabButtonActive]}
          onPress={() => setActivePanel('inventory')}>
          <Text style={[styles.tabButtonText, activePanel === 'inventory' && styles.tabButtonTextActive]}>
            Inventory
          </Text>
        </Pressable>
      </View>

      {activePanel === 'shop' ? (
        <View style={styles.grid}>
          {inventoryList.map((item) => {
            const owned = item.owned;
            const isSelected = selectedEmoji === item.id;
            const canAfford = harvest >= item.cost;

            return (
              <View key={item.id} style={styles.card}>
                <Pressable
                  style={[styles.emojiSlot, isSelected && styles.emojiSlotSelected]}
                  onPress={() => handleSelect(item.id, owned)}>
                  <Text style={styles.emojiGlyph}>{item.emoji}</Text>
                  <View style={styles.ownedBadge}>
                    <Text style={styles.ownedBadgeText}>x{owned}</Text>
                  </View>
                  {isSelected && <Text style={styles.selectedBadge}>Selected</Text>}
                </Pressable>
                <View style={styles.cardCopy}>
                  <Text style={styles.emojiName} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <Text style={styles.emojiCost}>{item.cost.toLocaleString()} harvest</Text>
                </View>
                <Pressable
                  accessibilityLabel={`Purchase ${item.name}`}
                  onPress={() => handlePurchase(item.id)}
                  disabled={!canAfford}
                  style={[styles.purchaseButton, !canAfford && styles.purchaseButtonDisabled]}>
                  <Text style={[styles.purchaseButtonText, !canAfford && styles.purchaseButtonTextDisabled]}>
                    {canAfford ? 'Buy' : 'Need harvest'}
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </View>
      ) : (
        <>
          <View style={styles.grid}>
            {ownedInventory.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateTitle}>No decorations yet</Text>
                <Text style={styles.emptyStateCopy}>
                  Visit the shop to purchase new friends for your garden.
                </Text>
              </View>
            ) : (
              ownedInventory.map((item) => {
                const isSelected = selectedEmoji === item.id;
                return (
                  <View key={item.id} style={styles.card}>
                    <Pressable
                      style={[styles.emojiSlot, isSelected && styles.emojiSlotSelected]}
                      onPress={() => handleSelect(item.id, item.owned)}>
                      <Text style={styles.emojiGlyph}>{item.emoji}</Text>
                      <View style={styles.ownedBadge}>
                        <Text style={styles.ownedBadgeText}>x{item.owned}</Text>
                      </View>
                      {isSelected && <Text style={styles.selectedBadge}>Selected</Text>}
                    </Pressable>
                    <View style={styles.cardCopy}>
                      <Text style={styles.emojiName}>{item.name}</Text>
                      <Text style={styles.emojiCost}>Owned • {item.owned}</Text>
                    </View>
                    <Pressable style={styles.secondaryButton} onPress={() => handleSelect(item.id, item.owned)}>
                      <Text style={styles.secondaryText}>Choose</Text>
                    </Pressable>
                  </View>
                );
              })
            )}
          </View>

          <Pressable style={styles.canvas} onPress={handleCanvasPress}>
            {placements.map((placement) => {
              const emoji = emojiCatalog.find((item) => item.id === placement.emojiId);

              if (!emoji) {
                return null;
              }

              return (
                <DraggablePlacement
                  key={placement.id}
                  placement={placement}
                  emoji={emoji.emoji}
                  onUpdate={(updates) => updatePlacement(placement.id, updates)}
                />
              );
            })}
          </Pressable>

          <View style={styles.canvasActions}>
            <Pressable
              style={[styles.ghostButton, placements.length === 0 && styles.disabledSecondary]}
              disabled={placements.length === 0}
              onPress={handleClearGarden}>
              <Text style={[styles.ghostButtonText, placements.length === 0 && styles.disabledText]}>
                Clear Garden
              </Text>
            </Pressable>
            <Pressable style={styles.primaryButton} onPress={handleSaveSnapshot}>
              <Text style={styles.primaryText}>Save</Text>
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}

const EMOJI_SIZE = 38;
const MIN_SCALE = 0.6;
const MAX_SCALE = 2.4;

type DraggablePlacementProps = {
  emoji: string;
  placement: Placement;
  onUpdate: (updates: Partial<Placement>) => void;
};

function DraggablePlacement({ emoji, placement, onUpdate }: DraggablePlacementProps) {
  const x = useSharedValue(placement.x);
  const y = useSharedValue(placement.y);
  const scale = useSharedValue(placement.scale ?? 1);
  const panStartX = useSharedValue(placement.x);
  const panStartY = useSharedValue(placement.y);
  const pinchStart = useSharedValue(placement.scale ?? 1);

  useEffect(() => {
    x.value = placement.x;
    y.value = placement.y;
    scale.value = placement.scale ?? 1;
  }, [placement.x, placement.y, placement.scale, scale, x, y]);

  const reportUpdate = () => {
    'worklet';
    const nextScale = Math.min(Math.max(scale.value, MIN_SCALE), MAX_SCALE);
    runOnJS(onUpdate)({ x: x.value, y: y.value, scale: nextScale });
  };

  const panGesture = Gesture.Pan()
    .onStart(() => {
      panStartX.value = x.value;
      panStartY.value = y.value;
    })
    .onChange((event) => {
      x.value = panStartX.value + event.translationX;
      y.value = panStartY.value + event.translationY;
    })
    .onEnd(reportUpdate)
    .onFinalize(reportUpdate);

  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      pinchStart.value = scale.value;
    })
    .onChange((event) => {
      const next = pinchStart.value * event.scale;
      scale.value = Math.min(Math.max(next, MIN_SCALE), MAX_SCALE);
    })
    .onEnd(reportUpdate)
    .onFinalize(reportUpdate);

  const composedGesture = Gesture.Simultaneous(panGesture, pinchGesture);

  const animatedStyle = useAnimatedStyle(() => {
    const clampedScale = Math.min(Math.max(scale.value, MIN_SCALE), MAX_SCALE);
    const halfSize = (EMOJI_SIZE * clampedScale) / 2;
    return {
      left: x.value - halfSize,
      top: y.value - halfSize,
      transform: [{ scale: clampedScale }],
    };
  });

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View style={[styles.canvasEmoji, animatedStyle]}>
        <Text style={styles.canvasEmojiGlyph}>{emoji}</Text>
      </Animated.View>
    </GestureDetector>
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
    gap: 10,
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
  },
  harvestHint: {
    marginTop: 4,
    color: '#e6fffa',
    fontSize: 14,
    lineHeight: 20,
  },
  panelTabs: {
    flexDirection: 'row',
    backgroundColor: '#e6fffa',
    borderRadius: 16,
    padding: 4,
    gap: 6,
  },
  tabButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 10,
  },
  tabButtonActive: {
    backgroundColor: '#22543d',
    shadowColor: '#0f2e20',
    shadowOpacity: 0.14,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 3,
  },
  tabButtonText: {
    textAlign: 'center',
    fontWeight: '600',
    color: '#276749',
    fontSize: 15,
  },
  tabButtonTextActive: {
    color: '#f0fff4',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-between',
  },
  card: {
    width: '47%',
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 14,
    shadowColor: '#2f855a',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 3,
    gap: 12,
  },
  emojiSlot: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
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
  emojiGlyph: {
    fontSize: 42,
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
  cardCopy: {
    gap: 4,
  },
  emojiName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#22543d',
    textAlign: 'center',
    minHeight: 36,
  },
  emojiCost: {
    fontSize: 12,
    color: '#4a5568',
    textAlign: 'center',
  },
  purchaseButton: {
    backgroundColor: '#2f855a',
    paddingVertical: 8,
    borderRadius: 12,
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
  secondaryButton: {
    backgroundColor: '#e6fffa',
    paddingVertical: 8,
    borderRadius: 12,
  },
  secondaryText: {
    textAlign: 'center',
    color: '#22543d',
    fontWeight: '600',
  },
  emptyState: {
    width: '100%',
    backgroundColor: '#f0fff4',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    gap: 6,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#22543d',
  },
  emptyStateCopy: {
    fontSize: 13,
    color: '#2d3748',
    textAlign: 'center',
    lineHeight: 18,
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
    width: EMOJI_SIZE,
    height: EMOJI_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  canvasEmojiGlyph: {
    fontSize: 34,
  },
  canvasActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  ghostButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#22543d',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostButtonText: {
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
