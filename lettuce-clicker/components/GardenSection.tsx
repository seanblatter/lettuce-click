import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  GestureResponderEvent,
  ListRenderItem,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { emojiCategoryOrder } from '@/constants/emojiCatalog';
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

type StrokePoint = {
  x: number;
  y: number;
};

type Stroke = {
  id: string;
  color: string;
  size: number;
  points: StrokePoint[];
};

const DRAW_COLORS = ['#1f6f4a', '#15803d', '#0ea5e9', '#ec4899', '#f59e0b', '#7c3aed', '#0f172a', '#f97316'];
const PEN_SIZES = [3, 5, 8, 12];

const CATEGORY_LABELS: Record<EmojiDefinition['category'], string> = {
  plants: 'Plants & Foliage',
  scenery: 'Scenery & Sky',
  creatures: 'Garden Creatures',
  features: 'Garden Features',
  accents: 'Atmosphere & Accents',
};

type CategoryFilter = 'all' | EmojiDefinition['category'];

const CATEGORY_OPTIONS: { id: CategoryFilter; label: string; icon: string }[] = [
  { id: 'all', label: 'All favorites', icon: '🌼' },
  { id: 'plants', label: 'Plants', icon: '🪴' },
  { id: 'scenery', label: 'Scenery', icon: '🌅' },
  { id: 'creatures', label: 'Creatures', icon: '🦋' },
  { id: 'features', label: 'Features', icon: '🏡' },
  { id: 'accents', label: 'Accents', icon: '✨' },
];

type InventoryEntry = EmojiDefinition & {
  owned: number;
  searchBlob: string;
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
  const insets = useSafeAreaInsets();
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [activeSheet, setActiveSheet] = useState<'shop' | 'inventory' | null>(null);
  const [shopFilter, setShopFilter] = useState('');
  const [showPalette, setShowPalette] = useState(false);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [penColor, setPenColor] = useState(DRAW_COLORS[0]);
  const [penSize, setPenSize] = useState(PEN_SIZES[1]);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [penHiddenForSave, setPenHiddenForSave] = useState(false);
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');

  const inventoryList = useMemo(
    () =>
      emojiCatalog
        .map<InventoryEntry>((item) => {
          const normalizedTags = item.tags.map((tag) => tag.toLowerCase());
          const normalizedName = item.name.toLowerCase();
          const condensedName = normalizedName.replace(/\s+/g, '');
          const categoryLabel = CATEGORY_LABELS[item.category].toLowerCase();
          const searchBlob = Array.from(
            new Set([
              normalizedName,
              condensedName,
              item.emoji.toLowerCase(),
              categoryLabel,
              ...normalizedTags,
            ])
          ).join(' ');

          return {
            ...item,
            owned: emojiInventory[item.id] ?? 0,
            searchBlob,
          };
        })
        .sort((a, b) => {
          const categoryDiff = emojiCategoryOrder[a.category] - emojiCategoryOrder[b.category];
          if (categoryDiff !== 0) {
            return categoryDiff;
          }

          if (a.popularity !== b.popularity) {
            return a.popularity - b.popularity;
          }

          if (a.cost !== b.cost) {
            return a.cost - b.cost;
          }

          return a.name.localeCompare(b.name);
        }),
    [emojiCatalog, emojiInventory]
  );

  const ownedInventory = useMemo(() => inventoryList.filter((item) => item.owned > 0), [inventoryList]);
  const normalizedFilter = shopFilter.trim().toLowerCase();
  const emojiFilterTokens = useMemo(
    () => (normalizedFilter ? Array.from(normalizedFilter).filter((glyph) => glyph.trim().length > 0) : []),
    [normalizedFilter]
  );
  const normalizedFilterWords = useMemo(
    () => (normalizedFilter ? normalizedFilter.split(/\s+/).filter(Boolean) : []),
    [normalizedFilter]
  );
  const matchesFilter = useCallback(
    (item: InventoryEntry) => {
      if (!normalizedFilter) {
        return true;
      }

      if (item.searchBlob.includes(normalizedFilter)) {
        return true;
      }

      if (normalizedFilterWords.length > 1 && normalizedFilterWords.every((word) => item.searchBlob.includes(word))) {
        return true;
      }

      if (item.emoji.toLowerCase().includes(normalizedFilter)) {
        return true;
      }

      return emojiFilterTokens.some((glyph) => item.emoji.includes(glyph));
    },
    [emojiFilterTokens, normalizedFilter, normalizedFilterWords]
  );
  const matchesCategory = useCallback(
    (item: InventoryEntry) => (activeCategory === 'all' ? true : item.category === activeCategory),
    [activeCategory]
  );
  const filteredShopInventory = useMemo(
    () =>
      inventoryList.filter((item) => matchesCategory(item) && matchesFilter(item)),
    [inventoryList, matchesCategory, matchesFilter]
  );
  const filteredOwnedInventory = useMemo(
    () =>
      ownedInventory.filter((item) => matchesCategory(item) && matchesFilter(item)),
    [matchesCategory, matchesFilter, ownedInventory]
  );
  const selectedDetails = useMemo(
    () => inventoryList.find((item) => item.id === selectedEmoji) ?? null,
    [inventoryList, selectedEmoji]
  );

  const handleCanvasPress = (event: GestureResponderEvent) => {
    if (isDrawingMode) {
      return;
    }

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

  const handleSelect = useCallback(
    (emojiId: string, owned: number) => {
      if (owned <= 0) {
        Alert.alert('Purchase required', 'Buy this decoration before placing it in the garden.');
        return;
      }

      setSelectedEmoji(emojiId);
      setActiveSheet(null);
    },
    []
  );

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
    setPenHiddenForSave(true);
    Alert.alert(
      'Save your garden',
      "Use your device's screenshot tools to capture the garden canvas once you finish decorating.",
      [
        {
          text: 'Got it',
          onPress: () => setPenHiddenForSave(false),
        },
      ],
      {
        cancelable: true,
        onDismiss: () => setPenHiddenForSave(false),
      }
    );
  };

  const handleClearDrawings = useCallback(() => {
    setStrokes([]);
    setCurrentStroke(null);
  }, []);

  const renderStrokeSegments = useCallback(
    (stroke: Stroke, prefix: string) => {
      if (stroke.points.length === 0) {
        return [] as JSX.Element[];
      }

      const segments: JSX.Element[] = [];
      const firstPoint = stroke.points[0];
      segments.push(
        <View
          key={`${prefix}-point-0`}
          style={[
            styles.strokeSegment,
            {
              width: stroke.size,
              height: stroke.size,
              borderRadius: stroke.size / 2,
              left: firstPoint.x - stroke.size / 2,
              top: firstPoint.y - stroke.size / 2,
              backgroundColor: stroke.color,
              transform: [],
            },
          ]}
        />
      );

      for (let index = 1; index < stroke.points.length; index += 1) {
        const prev = stroke.points[index - 1];
        const point = stroke.points[index];
        const dx = point.x - prev.x;
        const dy = point.y - prev.y;
        const distance = Math.hypot(dx, dy);

        if (distance === 0) {
          continue;
        }

        const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
        segments.push(
          <View
            key={`${prefix}-segment-${index}`}
            style={[
              styles.strokeSegment,
              {
                width: distance,
                height: stroke.size,
                backgroundColor: stroke.color,
                left: (prev.x + point.x) / 2 - distance / 2,
                top: (prev.y + point.y) / 2 - stroke.size / 2,
                borderRadius: stroke.size / 2,
                transform: [{ rotateZ: `${angle}deg` }],
              },
            ]}
          />
        );
      }

      return segments;
    },
    []
  );

  const beginStroke = useCallback(
    (x: number, y: number) => {
      const stroke: Stroke = {
        id: `stroke-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        color: penColor,
        size: penSize,
        points: [{ x, y }],
      };
      setCurrentStroke(stroke);
    },
    [penColor, penSize]
  );

  const appendPoint = useCallback((x: number, y: number) => {
    setCurrentStroke((prev) => {
      if (!prev) {
        return prev;
      }

      const lastPoint = prev.points[prev.points.length - 1];
      if (lastPoint && Math.abs(lastPoint.x - x) < 0.5 && Math.abs(lastPoint.y - y) < 0.5) {
        return prev;
      }

      return {
        ...prev,
        points: [...prev.points, { x, y }],
      };
    });
  }, []);

  const endStroke = useCallback(() => {
    setCurrentStroke((prev) => {
      if (prev && prev.points.length > 0) {
        setStrokes((existing) => [...existing, prev]);
      }
      return null;
    });
  }, []);

  const handleCanvasTouchStart = useCallback(
    (event: GestureResponderEvent) => {
      if (!isDrawingMode) {
        return;
      }

      const { locationX, locationY } = event.nativeEvent;
      beginStroke(locationX, locationY);
    },
    [beginStroke, isDrawingMode]
  );

  const handleCanvasTouchMove = useCallback(
    (event: GestureResponderEvent) => {
      if (!isDrawingMode) {
        return;
      }

      const touch = event.nativeEvent.touches?.[0];
      if (touch) {
        appendPoint(touch.locationX, touch.locationY);
        return;
      }

      appendPoint(event.nativeEvent.locationX, event.nativeEvent.locationY);
    },
    [appendPoint, isDrawingMode]
  );

  const handleCanvasTouchEnd = useCallback(() => {
    if (!isDrawingMode) {
      return;
    }

    endStroke();
  }, [endStroke, isDrawingMode]);

  useEffect(() => {
    if (!isDrawingMode) {
      setCurrentStroke(null);
    }
  }, [isDrawingMode]);

  const shouldShowCanvasEmptyState = useMemo(
    () => placements.length === 0 && strokes.length === 0 && !selectedEmoji && !isDrawingMode,
    [placements.length, strokes.length, selectedEmoji, isDrawingMode]
  );
  const handleCloseSheet = useCallback(() => setActiveSheet(null), []);
  const handleOpenSheet = useCallback((sheet: 'shop' | 'inventory') => setActiveSheet(sheet), []);

  const keyExtractor = useCallback((item: InventoryEntry) => item.id, []);

  const renderShopItem: ListRenderItem<InventoryEntry> = ({ item }) => {
    const owned = item.owned;
    const isSelected = selectedEmoji === item.id;
    const canAfford = harvest >= item.cost;
    const categoryLabel = CATEGORY_LABELS[item.category];

    const handleTilePress = () => {
      if (owned > 0) {
        handleSelect(item.id, owned);
        return;
      }
      handlePurchase(item.id);
    };

    return (
      <View style={styles.sheetTileWrapper}>
        <Pressable
          style={[
            styles.emojiTile,
            isSelected && styles.emojiTileSelected,
            !canAfford && owned === 0 && styles.emojiTileDisabled,
          ]}
          onPress={handleTilePress}
          accessibilityLabel={`${item.name} emoji`}
          accessibilityHint={
            owned > 0
              ? 'Select to ready this decoration.'
              : canAfford
              ? 'Purchase and ready this decoration.'
              : 'Not enough harvest to purchase.'
          }>
          <Text style={styles.emojiGlyphLarge}>{item.emoji}</Text>
          <Text style={styles.emojiTileLabel} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={styles.emojiTileFooter}>
            <Text style={[styles.emojiTileMeta, styles.emojiTileCategory]} numberOfLines={1}>
              {categoryLabel}
            </Text>
            <Text style={[styles.emojiTileMeta, styles.emojiTileCostText]} numberOfLines={1}>
              {item.cost.toLocaleString()} harvest
            </Text>
          </View>
          {owned > 0 ? (
            <View style={styles.emojiTileBadge}>
              <Text style={styles.emojiTileBadgeText}>×{owned}</Text>
            </View>
          ) : null}
        </Pressable>
        <View style={styles.tileActionRow}>
          <Pressable
            style={[styles.tileActionButton, !canAfford && styles.disabledSecondary]}
            onPress={() => handlePurchase(item.id)}
            disabled={!canAfford}
            accessibilityLabel={`Buy ${item.name}`}>
            <Text style={[styles.tileActionButtonText, !canAfford && styles.disabledText]}>Buy</Text>
          </Pressable>
          {owned > 0 ? (
            <Pressable
              style={[styles.tileActionButton, styles.tileActionGhost]}
              onPress={() => handleSelect(item.id, owned)}
              accessibilityLabel={`Select ${item.name}`}>
              <Text style={styles.tileActionGhostText}>Select</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    );
  };

  const renderInventoryItem: ListRenderItem<InventoryEntry> = ({ item }) => {
    const isSelected = selectedEmoji === item.id;
    const categoryLabel = CATEGORY_LABELS[item.category];

    return (
      <View style={styles.sheetTileWrapper}>
        <Pressable
          style={[styles.emojiTile, isSelected && styles.emojiTileSelected]}
          onPress={() => handleSelect(item.id, item.owned)}
          accessibilityLabel={`${item.name} emoji`}
          accessibilityHint="Select to ready this decoration.">
          <Text style={styles.emojiGlyphLarge}>{item.emoji}</Text>
          <Text style={styles.emojiTileLabel} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={styles.emojiTileFooter}>
            <Text style={[styles.emojiTileMeta, styles.emojiTileCategory]} numberOfLines={1}>
              {categoryLabel}
            </Text>
            <Text style={[styles.emojiTileMeta, styles.inventoryMeta]} numberOfLines={1}>
              Owned ×{item.owned}
            </Text>
          </View>
        </Pressable>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.contentScroll}
        contentContainerStyle={[
          styles.contentScrollContent,
          {
            paddingTop: Math.max(insets.top, 12),
            paddingBottom: insets.bottom + 48,
          },
        ]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.harvestBanner}>
          <Text style={styles.harvestTitle}>{title}</Text>
          <Text style={styles.harvestAmount}>{harvest.toLocaleString()} harvest ready</Text>
          <Text style={styles.harvestHint}>
            Your harvest bankroll is ready—shop curated emoji sets and paint the garden to life.
          </Text>
        </View>

        <View style={styles.launcherRow}>
          <Pressable
            style={styles.launcherCard}
            onPress={() => handleOpenSheet('shop')}
            accessibilityLabel="Open the Garden shop">
            <Text style={styles.launcherTitle}>Garden shop</Text>
            <Text style={styles.launcherCopy}>
              Discover popular plants, scenery, and accents tailored for storytelling scenes.
            </Text>
          </Pressable>
          <Pressable
            style={[styles.launcherCard, styles.launcherCardSecondary]}
            onPress={() => handleOpenSheet('inventory')}
            accessibilityLabel="Open your inventory">
            <Text style={[styles.launcherTitle, styles.launcherTitleSecondary]}>Inventory</Text>
            <Text style={[styles.launcherCopy, styles.launcherCopySecondary]}>
              Ready decorations you have purchased for placement.
            </Text>
          </Pressable>
        </View>

        <View style={styles.selectionStatus}>
          {selectedDetails ? (
            <>
              <Text style={styles.selectionStatusTitle}>
                Ready to place {selectedDetails.emoji} {selectedDetails.name}
              </Text>
              <Text style={styles.selectionStatusCopy}>
                Tap anywhere on the canvas to drop it. Drag to move, double tap to enlarge, and long
                press to shrink.
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.selectionStatusTitle}>No decoration selected</Text>
              <Text style={styles.selectionStatusCopy}>
                Choose an emoji from your inventory or the shop to prepare it for the garden canvas.
              </Text>
            </>
          )}
        </View>

        <View style={styles.canvasContainer}>
          <Pressable
            style={styles.canvas}
            onPress={handleCanvasPress}
            onTouchStart={handleCanvasTouchStart}
            onTouchMove={handleCanvasTouchMove}
            onTouchEnd={handleCanvasTouchEnd}
            onTouchCancel={handleCanvasTouchEnd}>
            <View pointerEvents="none" style={styles.drawingSurface}>
              {strokes.reduce<JSX.Element[]>((acc, stroke) => {
                acc.push(...renderStrokeSegments(stroke, stroke.id));
                return acc;
              }, [])}
              {currentStroke ? renderStrokeSegments(currentStroke, `${currentStroke.id}-live`) : null}
            </View>
            {isDrawingMode ? (
              <View pointerEvents="none" style={styles.drawingModeBadge}>
                <Text style={styles.drawingModeBadgeText}>Drawing mode</Text>
              </View>
            ) : null}
            {shouldShowCanvasEmptyState ? (
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

              return (
                <DraggablePlacement
                  key={placement.id}
                  placement={placement}
                  emoji={emoji.emoji}
                  onUpdate={(updates) => updatePlacement(placement.id, updates)}
                />
              );
            })}
            {!penHiddenForSave ? (
              <Pressable
                style={styles.penButton}
                accessibilityLabel="Open drawing palette"
                accessibilityHint="Opens options to pick colors and stroke sizes"
                onPress={() => setShowPalette(true)}>
                <View style={[styles.penButtonCircle, isDrawingMode && styles.penButtonCircleActive]}>
                  <Text style={[styles.penButtonIcon, isDrawingMode && styles.penButtonIconActive]}>✏️</Text>
                </View>
              </Pressable>
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
        </View>
      </ScrollView>
      <Modal
        visible={showPalette}
        animationType="slide"
        transparent
        onRequestClose={() => setShowPalette(false)}
      >
        <View style={styles.paletteOverlay}>
          <Pressable style={styles.paletteBackdrop} onPress={() => setShowPalette(false)} />
          <View style={styles.paletteCard}>
            <View style={styles.paletteHandle} />
            <Text style={styles.paletteTitle}>Garden sketchbook</Text>
            <Text style={styles.paletteSubtitle}>
              Choose a pen color and stroke size, then toggle drawing mode to sketch directly on your garden canvas.
            </Text>
            <View style={styles.paletteSection}>
              <Text style={styles.paletteLabel}>Pen color</Text>
              <View style={styles.paletteColorRow}>
                {DRAW_COLORS.map((color) => (
                  <Pressable
                    key={color}
                    style={[styles.colorSwatch, { backgroundColor: color }, penColor === color && styles.colorSwatchActive]}
                    onPress={() => setPenColor(color)}
                    accessibilityLabel={`Set pen color to ${color}`}
                  />
                ))}
              </View>
            </View>
            <View style={styles.paletteSection}>
              <Text style={styles.paletteLabel}>Pen size</Text>
              <View style={styles.paletteSizeRow}>
                {PEN_SIZES.map((size) => (
                  <Pressable
                    key={size}
                    style={[styles.sizeOption, penSize === size && styles.sizeOptionActive]}
                    onPress={() => setPenSize(size)}
                    accessibilityLabel={`Set pen size to ${size} pixels`}>
                    <View
                      style={[
                        styles.sizeOptionPreview,
                        { width: size * 2, height: size * 2, borderRadius: size, backgroundColor: penColor },
                      ]}
                    />
                    <Text style={styles.sizeOptionLabel}>{size}px</Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <Pressable
              style={[styles.drawingToggle, isDrawingMode && styles.drawingToggleActive]}
              onPress={() => setIsDrawingMode((prev) => !prev)}
              accessibilityLabel={isDrawingMode ? 'Disable drawing mode' : 'Enable drawing mode'}>
              <Text style={[styles.drawingToggleText, isDrawingMode && styles.drawingToggleTextActive]}>
                {isDrawingMode ? 'Drawing mode is on' : 'Enable drawing mode'}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.clearDrawingButton, strokes.length === 0 && styles.disabledSecondary]}
              onPress={handleClearDrawings}
              disabled={strokes.length === 0}
              accessibilityLabel="Clear all drawings">
              <Text style={[styles.clearDrawingText, strokes.length === 0 && styles.disabledText]}>Clear drawings</Text>
            </Pressable>
            <Pressable
              style={styles.paletteCloseButton}
              onPress={() => setShowPalette(false)}
              accessibilityLabel="Close drawing palette">
              <Text style={styles.paletteCloseButtonText}>Done</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      <Modal
        visible={activeSheet === 'shop'}
        animationType="slide"
        transparent
        onRequestClose={handleCloseSheet}
      >
        <View style={styles.sheetOverlay}>
          <Pressable style={styles.sheetBackdrop} onPress={handleCloseSheet} />
          <View style={styles.sheetCard}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Garden shop</Text>
            <Text style={styles.sheetSubtitle}>
              Curated categories make it easy to build cozy garden scenes with the essentials on top.
            </Text>
            <View style={styles.sheetSearchBlock}>
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
                {shopFilter.length > 0 ? (
                  <Pressable
                    accessibilityLabel="Clear emoji search"
                    style={styles.clearSearchButton}
                    onPress={() => setShopFilter('')}>
                    <Text style={styles.clearSearchText}>Clear</Text>
                  </Pressable>
                ) : null}
              </View>
              <Text style={styles.sheetHint}>Search by name, tags, or drop emoji characters directly.</Text>
            </View>
            <View style={styles.categoryFilterBlock}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryFilterContent}
              >
                {CATEGORY_OPTIONS.map((option) => {
                  const isActive = option.id === activeCategory;
                  return (
                    <Pressable
                      key={option.id}
                      style={[styles.categoryPill, isActive && styles.categoryPillActive]}
                      onPress={() => setActiveCategory(option.id)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isActive }}
                      accessibilityLabel={`Filter ${option.label}`}>
                      <Text style={[styles.categoryPillText, isActive && styles.categoryPillTextActive]}>
                        {`${option.icon} ${option.label}`}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
            <FlatList
              data={filteredShopInventory}
              renderItem={renderShopItem}
              keyExtractor={keyExtractor}
              numColumns={3}
              columnWrapperStyle={styles.sheetColumn}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.sheetListContent}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateTitle}>No emoji match your search</Text>
                  <Text style={styles.emptyStateCopy}>
                    Clear the search or try a different emoji keyword to keep shopping.
                  </Text>
                </View>
              }
            />
            <Pressable style={styles.sheetCloseButton} onPress={handleCloseSheet} accessibilityLabel="Close Garden shop">
              <Text style={styles.sheetCloseButtonText}>Done</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      <Modal
        visible={activeSheet === 'inventory'}
        animationType="slide"
        transparent
        onRequestClose={handleCloseSheet}
      >
        <View style={styles.sheetOverlay}>
          <Pressable style={styles.sheetBackdrop} onPress={handleCloseSheet} />
          <View style={styles.sheetCard}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Inventory</Text>
            <Text style={styles.sheetSubtitle}>
              Filter by category or tags to find the perfect decorations to ready for placement.
            </Text>
            <View style={styles.sheetSearchBlock}>
              <View style={styles.searchRow}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search your inventory"
                  placeholderTextColor="#4a5568"
                  value={shopFilter}
                  onChangeText={setShopFilter}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="search"
                />
                {shopFilter.length > 0 ? (
                  <Pressable
                    accessibilityLabel="Clear inventory search"
                    style={styles.clearSearchButton}
                    onPress={() => setShopFilter('')}>
                    <Text style={styles.clearSearchText}>Clear</Text>
                  </Pressable>
                ) : null}
              </View>
              <Text style={styles.sheetHint}>Filtering applies to both your inventory and the shop.</Text>
            </View>
            <View style={styles.categoryFilterBlock}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryFilterContent}
              >
                {CATEGORY_OPTIONS.map((option) => {
                  const isActive = option.id === activeCategory;
                  return (
                    <Pressable
                      key={option.id}
                      style={[styles.categoryPill, isActive && styles.categoryPillActive]}
                      onPress={() => setActiveCategory(option.id)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isActive }}
                      accessibilityLabel={`Filter ${option.label}`}>
                      <Text style={[styles.categoryPillText, isActive && styles.categoryPillTextActive]}>
                        {`${option.icon} ${option.label}`}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
            <FlatList
              data={filteredOwnedInventory}
              renderItem={renderInventoryItem}
              keyExtractor={keyExtractor}
              numColumns={3}
              columnWrapperStyle={styles.sheetColumn}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.sheetListContent}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateTitle}>Inventory is empty</Text>
                  <Text style={styles.emptyStateCopy}>
                    Purchase decorations in the shop, then come back to place them.
                  </Text>
                </View>
              }
            />
            <Pressable style={styles.sheetCloseButton} onPress={handleCloseSheet} accessibilityLabel="Close inventory">
              <Text style={styles.sheetCloseButtonText}>Done</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
  container: {
    flex: 1,
    backgroundColor: '#f2f9f2',
  },
  contentScroll: {
    flex: 1,
  },
  contentScrollContent: {
    paddingHorizontal: 24,
    gap: 24,
    paddingBottom: 24,
  },
  harvestBanner: {
    backgroundColor: '#22543d',
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingVertical: 24,
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
  launcherRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  launcherCard: {
    flex: 1,
    backgroundColor: '#22543d',
    borderRadius: 18,
    padding: 18,
    gap: 6,
    shadowColor: '#0f2e20',
    shadowOpacity: 0.16,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 14,
    elevation: 4,
    minWidth: 160,
  },
  launcherCardSecondary: {
    backgroundColor: '#e6fffa',
    shadowColor: '#0f766e',
  },
  launcherTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f0fff4',
  },
  launcherTitleSecondary: {
    color: '#134e32',
  },
  launcherCopy: {
    fontSize: 13,
    lineHeight: 19,
    color: '#c6f6d5',
  },
  launcherCopySecondary: {
    color: '#2d3748',
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
    width: '100%',
    minHeight: 120,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
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
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 4,
  },
  emojiTileMeta: {
    fontSize: 10,
    color: '#1f6f4a',
  },
  emojiTileCategory: {
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontWeight: '700',
    color: '#0f766e',
  },
  emojiTileCostText: {
    fontWeight: '700',
    color: '#0f766e',
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
  canvasContainer: {
    gap: 16,
    width: '100%',
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
  canvas: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    minHeight: 360,
    position: 'relative',
    shadowColor: '#22543d',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 6,
    overflow: 'hidden',
  },
  drawingSurface: {
    ...StyleSheet.absoluteFillObject,
  },
  drawingModeBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(34, 84, 61, 0.92)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  drawingModeBadgeText: {
    color: '#f0fff4',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
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
  penButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
  },
  penButtonCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f0fff4',
    borderWidth: 2,
    borderColor: '#1f6f4a',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#134e32',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  penButtonCircleActive: {
    backgroundColor: '#1f6f4a',
  },
  penButtonIcon: {
    fontSize: 26,
    color: '#1f6f4a',
  },
  penButtonIconActive: {
    color: '#f0fff4',
  },
  strokeSegment: {
    position: 'absolute',
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
  sheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 31, 23, 0.55)',
  },
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheetCard: {
    backgroundColor: '#f2f9f2',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
    gap: 16,
    maxHeight: '88%',
    width: '100%',
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 48,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#bbf7d0',
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#134e32',
    textAlign: 'center',
  },
  sheetSubtitle: {
    fontSize: 13,
    color: '#2d3748',
    textAlign: 'center',
    lineHeight: 18,
  },
  sheetSearchBlock: {
    gap: 8,
  },
  sheetHint: {
    fontSize: 12,
    color: '#0f766e',
    textAlign: 'center',
  },
  sheetColumn: {
    gap: 12,
    marginBottom: 12,
  },
  sheetListContent: {
    paddingBottom: 24,
    paddingHorizontal: 4,
  },
  categoryFilterBlock: {
    marginTop: 4,
  },
  categoryFilterContent: {
    gap: 8,
    paddingHorizontal: 4,
  },
  categoryPill: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#ecfdf3',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  categoryPillActive: {
    backgroundColor: '#22543d',
    borderColor: '#22543d',
    shadowColor: '#134e32',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  categoryPillText: {
    color: '#134e32',
    fontWeight: '600',
    fontSize: 12,
  },
  categoryPillTextActive: {
    color: '#f0fff4',
  },
  sheetTileWrapper: {
    flex: 1,
    paddingHorizontal: 4,
  },
  tileActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  tileActionButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#22543d',
  },
  tileActionButtonText: {
    color: '#f0fff4',
    fontWeight: '700',
  },
  tileActionGhost: {
    backgroundColor: '#ecfdf3',
    borderWidth: 1,
    borderColor: '#22543d',
  },
  tileActionGhostText: {
    color: '#134e32',
    fontWeight: '700',
  },
  sheetCloseButton: {
    marginTop: 12,
    borderRadius: 16,
    paddingVertical: 12,
    backgroundColor: '#22543d',
  },
  sheetCloseButtonText: {
    textAlign: 'center',
    color: '#f0fff4',
    fontWeight: '700',
    fontSize: 16,
  },
  paletteOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 31, 23, 0.55)',
    paddingBottom: 16,
  },
  paletteBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  paletteCard: {
    backgroundColor: '#f8fffb',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 28,
    gap: 16,
    shadowColor: '#0f2e20',
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: -4 },
  },
  paletteHandle: {
    alignSelf: 'center',
    width: 48,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#bbf7d0',
  },
  paletteTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#134e32',
    textAlign: 'center',
  },
  paletteSubtitle: {
    fontSize: 13,
    color: '#2d3748',
    textAlign: 'center',
    lineHeight: 18,
  },
  paletteSection: {
    gap: 10,
  },
  paletteLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#134e32',
  },
  paletteColorRow: {
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
    borderColor: '#1f6f4a',
    shadowColor: '#1f6f4a',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  paletteSizeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  sizeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    backgroundColor: '#ffffff',
  },
  sizeOptionActive: {
    borderColor: '#1f6f4a',
    backgroundColor: '#ecfdf3',
  },
  sizeOptionPreview: {
    borderRadius: 999,
  },
  sizeOptionLabel: {
    fontSize: 12,
    color: '#134e32',
    fontWeight: '600',
  },
  drawingToggle: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1f6f4a',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawingToggleActive: {
    backgroundColor: '#22543d',
  },
  drawingToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f6f4a',
  },
  drawingToggleTextActive: {
    color: '#f0fff4',
  },
  clearDrawingButton: {
    borderRadius: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#0f766e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearDrawingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f766e',
  },
  paletteCloseButton: {
    backgroundColor: '#22543d',
    borderRadius: 16,
    paddingVertical: 12,
  },
  paletteCloseButtonText: {
    textAlign: 'center',
    color: '#f0fff4',
    fontWeight: '700',
    fontSize: 16,
  },
});
