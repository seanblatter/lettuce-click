import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  GestureResponderEvent,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { DrawingStroke, EmojiDefinition, Placement } from '@/context/GameContext';
import type { EmojiSkinOption } from '@/types/emoji';

type Props = {
  harvest: number;
  emojiCatalog: EmojiDefinition[];
  emojiInventory: Record<string, number>;
  placements: Placement[];
  purchaseEmoji: (emojiId: string) => boolean;
  placeEmoji: (
    emojiId: string,
    position: { x: number; y: number },
    variant?: { id: string | null; emoji: string | null }
  ) => boolean;
  updatePlacement: (placementId: string, updates: Partial<Placement>) => void;
  clearGarden: () => void;
  drawings: DrawingStroke[];
  addDrawingStroke: (stroke: DrawingStroke) => void;
  clearDrawings: () => void;
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
  drawings,
  addDrawingStroke,
  clearDrawings,
  title = 'Garden Atelier',
}: Props) {
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<'shop' | 'inventory'>('shop');
  const [shopFilter, setShopFilter] = useState('');
  const [selectedVariant, setSelectedVariant] = useState<{ id: string | null; emoji: string | null } | null>(
    null
  );
  const [drawingActive, setDrawingActive] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<DrawingStroke | null>(null);
  const [penColor, setPenColor] = useState('#166534');
  const [penSize, setPenSize] = useState(6);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [hideFloatingAction, setHideFloatingAction] = useState(false);
  const previousSelectionRef = useRef<string | null>(null);

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

  const ownedInventory = useMemo(() => inventoryList.filter((item) => item.owned > 0), [inventoryList]);
  const normalizedFilter = shopFilter.trim().toLowerCase();
  const filteredShopInventory = useMemo(
    () =>
      normalizedFilter
        ? inventoryList.filter(
            (item) =>
              item.name.toLowerCase().includes(normalizedFilter) ||
              item.emoji.toLowerCase().includes(normalizedFilter)
          )
        : inventoryList,
    [inventoryList, normalizedFilter]
  );
  const limitedShopInventory = useMemo(
    () => (normalizedFilter ? filteredShopInventory : filteredShopInventory.slice(0, 120)),
    [filteredShopInventory, normalizedFilter]
  );
  const filteredOwnedInventory = useMemo(
    () =>
      normalizedFilter
        ? ownedInventory.filter(
            (item) =>
              item.name.toLowerCase().includes(normalizedFilter) ||
              item.emoji.toLowerCase().includes(normalizedFilter)
          )
        : ownedInventory,
    [normalizedFilter, ownedInventory]
  );
  const selectedDetails = useMemo(() => {
    if (!selectedEmoji) {
      return null;
    }
    return emojiCatalog.find((item) => item.id === selectedEmoji) ?? null;
  }, [emojiCatalog, selectedEmoji]);

  useEffect(() => {
    if (!selectedDetails) {
      previousSelectionRef.current = null;
      setSelectedVariant(null);
      return;
    }
    if (previousSelectionRef.current !== selectedDetails.id) {
      setSelectedVariant({ id: null, emoji: selectedDetails.emoji });
      previousSelectionRef.current = selectedDetails.id;
    }
  }, [selectedDetails]);

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
    const placed = placeEmoji(selectedEmoji, { x: locationX, y: locationY }, selectedVariant ?? undefined);

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
    setActivePanel('inventory');
  };

  const handlePurchase = (emojiId: string) => {
    const success = purchaseEmoji(emojiId);

    if (!success) {
      Alert.alert('Not enough harvest', 'Gather more lettuce to purchase this decoration.');
      return;
    }

    setSelectedEmoji(emojiId);
    setActivePanel('inventory');
  };

  const handleClearGarden = () => {
    clearGarden();
    setSelectedEmoji(null);
    setSelectedVariant(null);
    setDrawingActive(false);
    setPaletteOpen(false);
  };

  const handleSaveSnapshot = () => {
    setHideFloatingAction(true);
    Alert.alert(
      'Save your garden',
      "Use your device's screenshot tools to capture the garden canvas once you finish decorating."
    );
    setTimeout(() => setHideFloatingAction(false), 800);
  };

  const startStroke = (x: number, y: number) => {
    const newStroke: DrawingStroke = {
      id: `stroke-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      color: penColor,
      width: penSize,
      points: [{ x, y }],
    };
    setCurrentStroke(newStroke);
  };

  const extendStroke = (x: number, y: number) => {
    setCurrentStroke((prev) => {
      if (!prev) {
        return prev;
      }
      return {
        ...prev,
        points: [...prev.points, { x, y }],
      };
    });
  };

  const commitStroke = () => {
    setCurrentStroke((prev) => {
      if (!prev || prev.points.length < 2) {
        return null;
      }
      addDrawingStroke(prev);
      return null;
    });
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => drawingActive,
        onMoveShouldSetPanResponder: () => drawingActive,
        onPanResponderGrant: (evt) => {
          startStroke(evt.nativeEvent.locationX, evt.nativeEvent.locationY);
        },
        onPanResponderMove: (evt) => {
          extendStroke(evt.nativeEvent.locationX, evt.nativeEvent.locationY);
        },
        onPanResponderRelease: () => {
          commitStroke();
        },
        onPanResponderTerminate: () => {
          commitStroke();
        },
      }),
    [drawingActive, penColor, penSize, addDrawingStroke]
  );

  useEffect(() => {
    if (!drawingActive) {
      setCurrentStroke(null);
    }
  }, [drawingActive]);

  const renderStrokePath = (stroke: DrawingStroke) => {
    if (stroke.points.length < 2) {
      return null;
    }

    const d = stroke.points
      .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
      .join(' ');

    return (
      <Path
        key={stroke.id}
        d={d}
        stroke={stroke.color}
        strokeWidth={stroke.width}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    );
  };

  const variantOptions: EmojiSkinOption[] | null = selectedDetails?.skins ?? null;

  const handleVariantSelect = (variant: { id: string | null; emoji: string | null }) => {
    setSelectedVariant(variant);
  };


  return (
    <View style={styles.section}>
      <View style={styles.harvestBanner}>
        <Text style={styles.harvestTitle}>{title}</Text>
        <Text style={styles.harvestAmount}>{harvest.toLocaleString()} harvest ready</Text>
        <Text style={styles.harvestHint}>
          Purchase decorations in the shop, then switch to your inventory to tap the canvas and place
          them. Activate the pen to sketch extra flourishes.
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

      <View style={styles.shopToolbar}>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search or paste emoji"
            placeholderTextColor="#4a5568"
            value={shopFilter}
            onChangeText={setShopFilter}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {shopFilter.length > 0 && (
            <Pressable
              accessibilityLabel="Clear emoji search"
              style={styles.clearSearchButton}
              onPress={() => setShopFilter('')}>
              <Text style={styles.clearSearchText}>Clear</Text>
            </Pressable>
          )}
        </View>
        <Text style={styles.toolbarHint}>
          {activePanel === 'shop'
            ? 'Tap to buy or select. Purchases add items to your inventory instantly.'
            : 'Tap a tile to ready it for placement and choose skin tones if available.'}
        </Text>
      </View>

      {activePanel === 'shop' ? (
        <View style={styles.compactGrid}>
          {limitedShopInventory.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateTitle}>No emoji match your search</Text>
              <Text style={styles.emptyStateCopy}>
                Clear the search or try a different emoji keyword to keep shopping.
              </Text>
            </View>
          ) : (
            limitedShopInventory.map((item) => {
              const owned = item.owned;
              const isSelected = selectedEmoji === item.id;
              const canAfford = harvest >= item.cost;

              const handleTilePress = () => {
                handlePurchase(item.id);
              };

              return (
                  <Pressable
                    key={item.id}
                    style={[
                      styles.emojiTile,
                      isSelected && styles.emojiTileSelected,
                      !canAfford && owned === 0 && styles.emojiTileDisabled,
                    ]}
                    onPress={handleTilePress}
                    accessibilityLabel={`${item.name} emoji`}
                  accessibilityHint={
                    canAfford
                      ? 'Purchase this decoration. Owned copies appear in your inventory.'
                      : 'Not enough harvest to purchase.'
                  }>
                  <Text style={styles.emojiGlyphLarge}>{item.emoji}</Text>
                  <Text style={styles.emojiTileLabel} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <View style={styles.emojiTileFooter}>
                    <Text style={[styles.emojiTileMeta, styles.emojiTileCostText]} numberOfLines={1}>
                      {item.cost.toLocaleString()} harvest
                    </Text>
                    {isSelected ? (
                      <Text style={[styles.emojiTileMeta, styles.emojiTileSelectedText]}>Ready</Text>
                    ) : null}
                  </View>
                  {owned > 0 ? (
                    <View style={styles.emojiTileBadge}>
                      <Text style={styles.emojiTileBadgeText}>×{owned}</Text>
                    </View>
                  ) : null}
                </Pressable>
              );
            })
          )}
        </View>
      ) : (
        <>
          <View style={styles.compactGrid}>
            {filteredOwnedInventory.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateTitle}>Inventory is empty</Text>
                <Text style={styles.emptyStateCopy}>
                  Purchase decorations in the shop, then come back to place them.
                </Text>
              </View>
            ) : (
              filteredOwnedInventory.map((item) => {
                const isSelected = selectedEmoji === item.id;
                return (
                  <Pressable
                    key={item.id}
                    style={[styles.emojiTile, isSelected && styles.emojiTileSelected]}
                    onPress={() => handleSelect(item.id, item.owned)}
                    accessibilityLabel={`${item.name} emoji`}
                    accessibilityHint="Select to ready this decoration.">
                    <Text style={styles.emojiGlyphLarge}>{item.emoji}</Text>
                    <Text style={styles.emojiTileLabel} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <View style={styles.emojiTileFooter}>
                      <Text style={[styles.emojiTileMeta, styles.inventoryMeta]} numberOfLines={1}>
                        Owned ×{item.owned}
                      </Text>
                      {isSelected ? (
                        <Text style={[styles.emojiTileMeta, styles.emojiTileSelectedText]}>Ready</Text>
                      ) : null}
                    </View>
                  </Pressable>
                );
              })
            )}
          </View>

          <View style={styles.selectionStatus}>
            {selectedDetails ? (
              <>
                <Text style={styles.selectionStatusTitle}>
                  Ready to place {selectedDetails.emoji} {selectedDetails.name}
                </Text>
                <Text style={styles.selectionStatusCopy}>
                  Tap anywhere on the canvas to drop it. Drag to move, double tap to enlarge, and
                  long press to shrink.
                </Text>
                {variantOptions && variantOptions.length > 0 ? (
                  <View style={styles.variantSelector}>
                    {[{ id: null, emoji: selectedDetails.emoji, name: 'Default' }, ...variantOptions].map(
                      (variant) => {
                        const isActive =
                          (variant.id ?? null) === selectedVariant?.id ||
                          (variant.id === null && selectedVariant?.id == null && selectedVariant?.emoji === variant.emoji);
                        const label =
                          variant.id === null
                            ? 'Default'
                            : variant.name
                                .replace(selectedDetails.name, '')
                                .replace(/[:]/g, '')
                                .trim() || variant.name;
                        return (
                          <Pressable
                            key={variant.id ?? 'default'}
                            style={[styles.variantChip, isActive && styles.variantChipActive]}
                            onPress={() => handleVariantSelect({ id: variant.id ?? null, emoji: variant.emoji })}
                          >
                            <Text style={styles.variantChipEmoji}>{variant.emoji}</Text>
                            <Text
                              style={[styles.variantChipLabel, isActive && styles.variantChipLabelActive]}
                              numberOfLines={1}
                            >
                              {label}
                            </Text>
                          </Pressable>
                        );
                      }
                    )}
                  </View>
                ) : null}
              </>
            ) : (
              <>
                <Text style={styles.selectionStatusTitle}>No decoration selected</Text>
                <Text style={styles.selectionStatusCopy}>
                  Choose an emoji above to prepare it for the garden canvas.
                </Text>
              </>
            )}
          </View>

          <Pressable
            style={styles.canvas}
            onPress={drawingActive ? undefined : handleCanvasPress}
            disabled={drawingActive}
          >
            {placements.length === 0 ? (
              <View pointerEvents="none" style={styles.canvasEmptyState}>
                <Text style={styles.canvasEmptyTitle}>Tap the canvas to begin</Text>
                <Text style={styles.canvasEmptyCopy}>
                  Selected emojis will appear where you tap. Adjust them later by dragging, double
                  tapping, or long pressing.
                </Text>
              </View>
            ) : null}
            {placements.map((placement) => {
              const emoji = emojiCatalog.find((item) => item.id === placement.emojiId);

              if (!emoji) {
                return null;
              }

              const displayEmoji = placement.variantEmoji ?? emoji.emoji;

              return (
                <DraggablePlacement
                  key={placement.id}
                  placement={placement}
                  emoji={displayEmoji}
                  onUpdate={(updates) => updatePlacement(placement.id, updates)}
                />
              );
            })}
            <View
              pointerEvents={drawingActive ? 'auto' : 'none'}
              style={StyleSheet.absoluteFill}
              {...(drawingActive ? panResponder.panHandlers : {})}
            >
              <Svg width="100%" height="100%">
                {drawings.map((stroke) => renderStrokePath(stroke))}
                {currentStroke ? renderStrokePath(currentStroke) : null}
              </Svg>
            </View>
            {!hideFloatingAction && (
              <View style={styles.canvasFabWrapper} pointerEvents="box-none">
                <Pressable
                  style={[styles.canvasFab, drawingActive && styles.canvasFabActive]}
                  onPress={() => {
                    setDrawingActive((prev) => {
                      const next = !prev;
                      setPaletteOpen(next);
                      return next;
                    });
                  }}
                  accessibilityLabel="Toggle drawing palette"
                >
                  <Text style={styles.canvasFabIcon}>🖊️</Text>
                </Pressable>
              </View>
            )}
            {paletteOpen && drawingActive ? (
              <View style={styles.paletteCard} pointerEvents="box-none">
                <View style={styles.paletteContent}>
                  <Text style={styles.paletteTitle}>Drawing Palette</Text>
                  <Text style={styles.paletteHint}>Pick a color and pen size, then drag across the canvas.</Text>
                  <View style={styles.paletteRow}>
                    {['#166534', '#dc2626', '#1d4ed8', '#f59e0b', '#9333ea', '#0f766e'].map((color) => (
                      <Pressable
                        key={color}
                        style={[styles.colorSwatch, { backgroundColor: color }, penColor === color && styles.colorSwatchActive]}
                        onPress={() => setPenColor(color)}
                        accessibilityLabel={`Select ${color} ink`}
                      />
                    ))}
                  </View>
                  <View style={styles.paletteRow}>
                    {[4, 6, 8, 12, 16].map((size) => (
                      <Pressable
                        key={size}
                        style={[styles.sizeChip, penSize === size && styles.sizeChipActive]}
                        onPress={() => setPenSize(size)}
                      >
                        <Text style={[styles.sizeChipLabel, penSize === size && styles.sizeChipLabelActive]}>
                          {size}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                  <View style={styles.paletteActions}>
                    <Pressable
                      style={styles.paletteButton}
                      onPress={() => {
                        clearDrawings();
                        setCurrentStroke(null);
                      }}
                    >
                      <Text style={styles.paletteButtonText}>Clear Sketch</Text>
                    </Pressable>
                    <Pressable
                      style={styles.paletteButton}
                      onPress={() => {
                        setDrawingActive(false);
                        setPaletteOpen(false);
                      }}
                    >
                      <Text style={styles.paletteButtonText}>Done</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            ) : null}
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
    scale.value = nextScale;
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

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      scale.value = Math.min(scale.value * 1.25, MAX_SCALE);
      reportUpdate();
    });

  const longPressGesture = Gesture.LongPress()
    .minDuration(350)
    .onEnd(() => {
      scale.value = Math.max(scale.value * 0.8, MIN_SCALE);
      reportUpdate();
    });

  const composedGesture = Gesture.Simultaneous(panGesture, pinchGesture, doubleTapGesture, longPressGesture);

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
  shopToolbar: {
    backgroundColor: '#e6fffa',
    borderRadius: 18,
    padding: 14,
    gap: 10,
    shadowColor: '#0f766e',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 3,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#134e32',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  clearSearchButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#bbf7d0',
  },
  clearSearchText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#14532d',
  },
  toolbarHint: {
    fontSize: 12,
    color: '#0f766e',
    lineHeight: 18,
  },
  compactGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'flex-start',
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
  emojiTile: {
    flexBasis: '22%',
    maxWidth: '24%',
    minWidth: 72,
    minHeight: 116,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: '#d1fae5',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#0f766e',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  emojiTileSelected: {
    borderColor: '#166534',
    backgroundColor: '#dcfce7',
    shadowColor: '#166534',
    shadowOpacity: 0.2,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  emojiTileDisabled: {
    opacity: 0.55,
  },
  emojiGlyphLarge: {
    fontSize: 34,
  },
  emojiTileLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#134e32',
    textAlign: 'center',
    width: '100%',
  },
  emojiTileFooter: {
    marginTop: 'auto',
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  emojiTileMeta: {
    fontSize: 10,
    color: '#1f6f4a',
  },
  emojiTileCostText: {
    fontWeight: '700',
    color: '#0f766e',
  },
  emojiTileSelectedText: {
    fontWeight: '700',
    color: '#166534',
  },
  emojiTileBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(15, 118, 110, 0.9)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  emojiTileBadgeText: {
    color: '#ecfdf3',
    fontSize: 11,
    fontWeight: '700',
  },
  inventoryMeta: {
    color: '#22543d',
  },
  selectionStatus: {
    backgroundColor: '#e6fffa',
    borderRadius: 18,
    padding: 16,
    gap: 6,
    shadowColor: '#0f766e',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 3,
  },
  selectionStatusTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#134e32',
  },
  selectionStatusCopy: {
    fontSize: 13,
    color: '#2d3748',
    lineHeight: 19,
  },
  variantSelector: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  variantChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#134e32',
    backgroundColor: '#f0fff4',
  },
  variantChipActive: {
    backgroundColor: '#166534',
    borderColor: '#14532d',
  },
  variantChipEmoji: {
    fontSize: 20,
  },
  variantChipLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#134e32',
    maxWidth: 96,
  },
  variantChipLabelActive: {
    color: '#f0fff4',
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
  canvasEmptyState: {
    position: 'absolute',
    top: '32%',
    left: 24,
    right: 24,
    alignItems: 'center',
    gap: 6,
  },
  canvasEmptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#134e32',
    textAlign: 'center',
  },
  canvasEmptyCopy: {
    fontSize: 13,
    color: '#2d3748',
    textAlign: 'center',
    lineHeight: 18,
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
  canvasFabWrapper: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
  canvasFab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(34, 84, 61, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0f2e20',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  canvasFabActive: {
    backgroundColor: '#166534',
  },
  canvasFabIcon: {
    fontSize: 24,
  },
  paletteCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 88,
  },
  paletteContent: {
    backgroundColor: 'rgba(240, 255, 244, 0.98)',
    borderRadius: 18,
    padding: 16,
    gap: 12,
    shadowColor: '#0f766e',
    shadowOpacity: 0.16,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  paletteTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#134e32',
  },
  paletteHint: {
    fontSize: 12,
    color: '#2d3748',
    lineHeight: 18,
  },
  paletteRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  colorSwatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorSwatchActive: {
    borderColor: '#0f172a',
  },
  sizeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#134e32',
    backgroundColor: '#ffffff',
  },
  sizeChipActive: {
    backgroundColor: '#166534',
    borderColor: '#14532d',
  },
  sizeChipLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#134e32',
  },
  sizeChipLabelActive: {
    color: '#f0fff4',
  },
  paletteActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  paletteButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 10,
    backgroundColor: '#22543d',
  },
  paletteButtonText: {
    textAlign: 'center',
    fontWeight: '700',
    color: '#f0fff4',
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
