import React, { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  LayoutChangeEvent,
  GestureResponderEvent,
  LayoutRectangle,
  ListRenderItem,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextStyle,
  Image,
  View,
  Keyboard,
  useWindowDimensions,
} from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import * as ImagePicker from 'expo-image-picker';
import { Directions, Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { captureRef } from 'react-native-view-shot';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { emojiCategoryOrder } from '@/constants/emojiCatalog';
import { EmojiDefinition, Placement, TextStyleId } from '@/context/GameContext';

type Props = {
  harvest: number;
  emojiCatalog: EmojiDefinition[];
  emojiInventory: Record<string, number>;
  placements: Placement[];
  purchaseEmoji: (emojiId: string) => boolean;
  placeEmoji: (emojiId: string, position: { x: number; y: number }) => boolean;
  addPhotoPlacement: (uri: string, position: { x: number; y: number }) => boolean;
  addTextPlacement: (
    text: string,
    position: { x: number; y: number },
    color?: string,
    style?: TextStyleId,
    scale?: number
  ) => boolean;
  updatePlacement: (placementId: string, updates: Partial<Placement>) => void;
  removePlacement: (placementId: string) => void;
  clearGarden: () => void;
  registerCustomEmoji: (emoji: string) => EmojiDefinition | null;
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

const VARIATION_SELECTOR_REGEX = /[\uFE0E\uFE0F]/g;
const EMOJI_SEQUENCE_REGEX = /\p{Extended_Pictographic}(?:\u200d\p{Extended_Pictographic})*/gu;

const stripVariationSelectors = (value: string) => value.replace(VARIATION_SELECTOR_REGEX, '');

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const CANVAS_BACKGROUND = '#ffffff';
const ERASER_COLOR = 'eraser';
const DEFAULT_TEXT_COLOR = '#14532d';
const SERIF_FONT_FAMILY = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }) ?? 'serif';
const ROUNDED_FONT_FAMILY =
  Platform.select({ ios: 'AvenirNext-DemiBold', android: 'sans-serif-medium', default: 'sans-serif' }) ??
  'sans-serif';
const SCRIPT_FONT_FAMILY =
  Platform.select({ ios: 'Snell Roundhand', android: 'cursive', default: 'cursive' }) ?? 'cursive';
const MONO_FONT_FAMILY = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }) ?? 'monospace';
const QUICK_DRAW_COLORS = [
  '#1f6f4a',
  '#15803d',
  '#ef4444',
  '#0ea5e9',
  '#ec4899',
  '#f59e0b',
  '#7c3aed',
  '#0f172a',
  '#f97316',
];
const COLOR_WHEEL_COLORS = [
  '#ef4444',
  '#f97316',
  '#facc15',
  '#22c55e',
  '#0ea5e9',
  '#38bdf8',
  '#6366f1',
  '#a855f7',
  '#ec4899',
  '#f472b6',
  '#94a3b8',
  '#0f172a',
];
const COLOR_WHEEL_DIAMETER = 160;
const COLOR_WHEEL_RADIUS = 64;
const COLOR_WHEEL_SWATCH_SIZE = 34;
const PEN_SIZES = [3, 5, 8, 12];
const TEXT_SCALE_MIN = 0.7;
const TEXT_SCALE_MAX = 2;
const TEXT_SLIDER_THUMB_SIZE = 24;

const TEXT_STYLE_OPTIONS: { id: TextStyleId; label: string; textStyle: TextStyle; preview: string }[] = [
  { id: 'sprout', label: 'Sprout', textStyle: { fontSize: 18, fontWeight: '600' }, preview: 'Hello' },
  {
    id: 'bloom',
    label: 'Bloom',
    textStyle: { fontSize: 22, fontWeight: '700', letterSpacing: 0.4 },
    preview: 'Bloom',
  },
  {
    id: 'canopy',
    label: 'Canopy',
    textStyle: { fontSize: 26, fontWeight: '800', textTransform: 'uppercase' },
    preview: 'Rise',
  },
  {
    id: 'whisper',
    label: 'Whisper',
    textStyle: { fontSize: 20, fontStyle: 'italic', fontWeight: '500' },
    preview: 'Calm',
  },
  {
    id: 'serif',
    label: 'Serif',
    textStyle: { fontSize: 22, fontWeight: '600', fontFamily: SERIF_FONT_FAMILY },
    preview: 'Serif',
  },
  {
    id: 'rounded',
    label: 'Rounded',
    textStyle: {
      fontSize: 20,
      fontWeight: '700',
      letterSpacing: 0.3,
      fontFamily: ROUNDED_FONT_FAMILY,
    },
    preview: 'Smile',
  },
  {
    id: 'script',
    label: 'Script',
    textStyle: {
      fontSize: 24,
      fontFamily: SCRIPT_FONT_FAMILY,
      fontWeight: Platform.OS === 'ios' ? '400' : '500',
    },
    preview: 'Flow',
  },
  {
    id: 'mono',
    label: 'Mono',
    textStyle: {
      fontSize: 20,
      letterSpacing: 1,
      fontFamily: MONO_FONT_FAMILY,
      fontWeight: '500',
    },
    preview: 'Code',
  },
];

const TEXT_STYLE_MAP = TEXT_STYLE_OPTIONS.reduce<Record<TextStyleId, TextStyle>>((acc, option) => {
  acc[option.id] = option.textStyle;
  return acc;
}, {} as Record<TextStyleId, TextStyle>);

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

const INVENTORY_COLUMNS = 3;
const INVENTORY_COLUMN_GAP = 12;
const INVENTORY_ROW_GAP = 12;
const SHOP_EMOJI_CHOICES = ['🏡', '🚀', '🛍', '📱'] as const;
const INVENTORY_EMOJI_CHOICES = ['🧰', '📦', '💼', '👜'] as const;

type InventoryEntry = EmojiDefinition & {
  owned: number;
  searchBlob: string;
  normalizedEmoji: string;
};

type EmojiToken = {
  original: string;
  normalized: string;
};

export function GardenSection({
  harvest,
  emojiCatalog,
  emojiInventory,
  placements,
  purchaseEmoji,
  placeEmoji,
  addPhotoPlacement,
  addTextPlacement,
  updatePlacement,
  removePlacement,
  clearGarden,
  registerCustomEmoji,
  title = 'Lettuce Gardens',
}: Props) {
  const insets = useSafeAreaInsets();
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [activeSheet, setActiveSheet] = useState<'shop' | 'inventory' | null>(null);
  const [shopFilter, setShopFilter] = useState('');
  const [showPalette, setShowPalette] = useState(false);
  const [isFontDropdownOpen, setFontDropdownOpen] = useState(false);
  const [showExtendedPalette, setShowExtendedPalette] = useState(false);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [penColor, setPenColor] = useState<string>(QUICK_DRAW_COLORS[0]);
  const [penSize, setPenSize] = useState(PEN_SIZES[1]);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [penHiddenForSave, setPenHiddenForSave] = useState(false);
  const [isSavingSnapshot, setIsSavingSnapshot] = useState(false);
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');
  const [inventoryOrder, setInventoryOrder] = useState<string[]>([]);
  const [draggingInventoryId, setDraggingInventoryId] = useState<string | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [isPickingPhoto, setIsPickingPhoto] = useState(false);
  const [textDraft, setTextDraft] = useState('');
  const [selectedTextStyle, setSelectedTextStyle] = useState<TextStyleId>('sprout');
  const [textScale, setTextScale] = useState(1);
  const [textSliderWidth, setTextSliderWidth] = useState(0);
  const [shopEmoji, setShopEmoji] = useState('🏡');
  const [inventoryEmoji, setInventoryEmoji] = useState('🧰');
  const [activeEmojiPicker, setActiveEmojiPicker] = useState<'shop' | 'inventory' | null>(null);
  const [isDrawingGestureActive, setIsDrawingGestureActive] = useState(false);
  const [activeDrag, setActiveDrag] = useState<{ id: string; point: { x: number; y: number } } | null>(null);
  const [penButtonLayout, setPenButtonLayout] = useState<LayoutRectangle | null>(null);
  const canvasRef = useRef<View | null>(null);
  const filteredOwnedInventoryRef = useRef<InventoryEntry[]>([]);
  const draggingInventoryIdRef = useRef<string | null>(null);
  const dragStartIndexRef = useRef(0);
  const dragCurrentIndexRef = useRef(0);
  const tileSizeRef = useRef<{ width: number; height: number }>({ width: 0, height: 0 });
  const colorWheelPositions = useMemo(
    () =>
      COLOR_WHEEL_COLORS.map((color, index) => {
        const angle = (index / COLOR_WHEEL_COLORS.length) * 2 * Math.PI - Math.PI / 2;
        const center = COLOR_WHEEL_DIAMETER / 2;
        const offset = COLOR_WHEEL_SWATCH_SIZE / 2;
        const left = center + Math.cos(angle) * COLOR_WHEEL_RADIUS - offset;
        const top = center + Math.sin(angle) * COLOR_WHEEL_RADIUS - offset;
        return { color, left, top };
      }),
    []
  );

  const { height: windowHeight } = useWindowDimensions();
  const paletteMaxHeight = Math.max(windowHeight - insets.top - 32, 360);
  const palettePaddingBottom = 24 + insets.bottom;

  useEffect(() => {
    setActiveEmojiPicker(null);
  }, [activeSheet]);

  const deleteZoneCenter = useMemo(() => {
    if (!penButtonLayout) {
      return null;
    }

    return {
      x: penButtonLayout.x + penButtonLayout.width / 2,
      y: penButtonLayout.y + penButtonLayout.height / 2,
    };
  }, [penButtonLayout]);

  const isPointInDeleteZone = useCallback(
    (point: { x: number; y: number } | null) => {
      if (!point || !penButtonLayout || !deleteZoneCenter) {
        return false;
      }

      const radius = Math.max(penButtonLayout.width, penButtonLayout.height) / 2 + 24;
      const dx = point.x - deleteZoneCenter.x;
      const dy = point.y - deleteZoneCenter.y;
      return Math.hypot(dx, dy) <= radius;
    },
    [deleteZoneCenter, penButtonLayout]
  );

  const isDragOverDeleteZone = useMemo(
    () => (activeDrag ? isPointInDeleteZone(activeDrag.point) : false),
    [activeDrag, isPointInDeleteZone]
  );

  const deleteZoneVisible = Boolean(activeDrag);
  const shouldHighlightDeleteZone = deleteZoneVisible && isDragOverDeleteZone;

  const inventoryList = useMemo(
    () =>
      emojiCatalog
        .map<InventoryEntry>((item) => {
          const normalizedTags = item.tags.map((tag) => tag.toLowerCase());
          const normalizedName = item.name.toLowerCase();
          const condensedName = normalizedName.replace(/\s+/g, '');
          const categoryLabel = CATEGORY_LABELS[item.category].toLowerCase();
          const normalizedEmoji = stripVariationSelectors(item.emoji).toLowerCase();
          const searchBlob = Array.from(
            new Set([
              normalizedName,
              condensedName,
              item.emoji.toLowerCase(),
              normalizedEmoji,
              categoryLabel,
              ...normalizedTags,
            ])
          ).join(' ');

          return {
            ...item,
            owned: emojiInventory[item.id] ?? 0,
            searchBlob,
            normalizedEmoji,
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
  const normalizedFilterEmoji = useMemo(() => stripVariationSelectors(normalizedFilter), [normalizedFilter]);
  const emojiTokens = useMemo<EmojiToken[]>(() => {
    const matches = shopFilter.match(EMOJI_SEQUENCE_REGEX);

    if (!matches) {
      return [];
    }

    return matches
      .map((glyph) => glyph.trim())
      .filter((glyph) => glyph.length > 0)
      .map((glyph) => {
        const normalized = stripVariationSelectors(glyph).toLowerCase();
        return normalized.length > 0 ? { original: glyph, normalized } : null;
      })
      .filter((token): token is EmojiToken => Boolean(token));
  }, [shopFilter]);
  const normalizedEmojiTokens = useMemo(
    () => emojiTokens.map((token) => token.normalized),
    [emojiTokens]
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

      if (normalizedFilterEmoji && item.normalizedEmoji.includes(normalizedFilterEmoji)) {
        return true;
      }

      return normalizedEmojiTokens.some((glyph) => item.normalizedEmoji.includes(glyph));
    },
    [normalizedEmojiTokens, normalizedFilter, normalizedFilterEmoji, normalizedFilterWords]
  );
  const matchesCategory = useCallback(
    (item: InventoryEntry) => (activeCategory === 'all' ? true : item.category === activeCategory),
    [activeCategory]
  );

  useEffect(() => {
    if (emojiTokens.length === 0) {
      return;
    }

    const seen = new Set<string>();
    emojiTokens.forEach((token) => {
      if (seen.has(token.original)) {
        return;
      }
      seen.add(token.original);
      registerCustomEmoji(token.original);
    });
  }, [emojiTokens, registerCustomEmoji]);

  const filteredShopInventory = useMemo(() => {
    const filtered = inventoryList.filter((item) => matchesCategory(item) && matchesFilter(item));

    if (filtered.length === 0 && normalizedFilter && normalizedEmojiTokens.length === 0) {
      return inventoryList.filter((item) => matchesCategory(item));
    }

    return filtered;
  }, [inventoryList, matchesCategory, matchesFilter, normalizedEmojiTokens, normalizedFilter]);
  const filteredOwnedInventory = useMemo(() => {
    const filtered = ownedInventory.filter((item) => matchesCategory(item) && matchesFilter(item));

    const applyOrder = (items: InventoryEntry[]) => {
      return [...items].sort((a, b) => {
        const orderA = inventoryOrder.indexOf(a.id);
        const orderB = inventoryOrder.indexOf(b.id);

        if (orderA === -1 && orderB === -1) {
          return 0;
        }

        if (orderA === -1) {
          return 1;
        }

        if (orderB === -1) {
          return -1;
        }

        return orderA - orderB;
      });
    };

    if (filtered.length === 0 && normalizedFilter && ownedInventory.length > 0) {
      return applyOrder(ownedInventory.filter((item) => matchesCategory(item)));
    }

    return applyOrder(filtered);
  }, [inventoryOrder, matchesCategory, matchesFilter, normalizedFilter, ownedInventory]);
  const selectedDetails = useMemo(
    () => inventoryList.find((item) => item.id === selectedEmoji) ?? null,
    [inventoryList, selectedEmoji]
  );

  useEffect(() => {
    if (ownedInventory.length === 0) {
      setInventoryOrder([]);
      return;
    }

    setInventoryOrder((prev) => {
      const retained = prev.filter((id) => ownedInventory.some((entry) => entry.id === id));
      const missing = ownedInventory
        .map((entry) => entry.id)
        .filter((id) => !retained.includes(id));
      return [...retained, ...missing];
    });
  }, [ownedInventory]);

  useEffect(() => {
    filteredOwnedInventoryRef.current = filteredOwnedInventory;
  }, [filteredOwnedInventory]);

  useEffect(() => {
    draggingInventoryIdRef.current = draggingInventoryId;
  }, [draggingInventoryId]);

  const canReorderInventory = useMemo(
    () =>
      activeCategory === 'all' &&
      normalizedFilter.length === 0 &&
      normalizedEmojiTokens.length === 0 &&
      ownedInventory.length > 0,
    [activeCategory, normalizedEmojiTokens.length, normalizedFilter.length, ownedInventory.length]
  );

  const handleInventoryTileLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;

    if (width > 0 && height > 0) {
      tileSizeRef.current = { width, height };
    }
  }, []);

  const handleCanvasLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;

    if (width > 0 && height > 0) {
      setCanvasSize({ width, height });
    }
  }, []);

  const getCanvasCenter = useCallback(() => {
    const { width, height } = canvasSize;

    if (width <= 0 || height <= 0) {
      return { x: 180, y: 200 };
    }

    return { x: width / 2, y: height / 2 };
  }, [canvasSize]);

  const commitInventoryReorder = useCallback((emojiId: string, targetIndex: number) => {
    const list = filteredOwnedInventoryRef.current;

    if (list.length === 0) {
      return;
    }

    const ids = list.map((entry) => entry.id);
    const boundedIndex = Math.max(0, Math.min(ids.length - 1, targetIndex));
    const baseOrder = ids.filter((id, index) => ids.indexOf(id) === index);
    const currentIndex = baseOrder.indexOf(emojiId);

    if (currentIndex !== -1) {
      baseOrder.splice(currentIndex, 1);
    }

    baseOrder.splice(boundedIndex, 0, emojiId);

    setInventoryOrder((prev) => {
      const remaining = prev.filter((id) => !baseOrder.includes(id));
      return [...baseOrder, ...remaining];
    });
  }, []);

  const beginInventoryDrag = useCallback((emojiId: string, index: number) => {
    dragStartIndexRef.current = index;
    dragCurrentIndexRef.current = index;
    draggingInventoryIdRef.current = emojiId;
    setDraggingInventoryId(emojiId);
  }, []);

  const updateInventoryDrag = useCallback(
    (translationX: number, translationY: number) => {
      const activeId = draggingInventoryIdRef.current;

      if (!activeId) {
        return;
      }

      const { width, height } = tileSizeRef.current;

      if (width <= 0 || height <= 0) {
        return;
      }

      const effectiveWidth = width + INVENTORY_COLUMN_GAP;
      const effectiveHeight = height + INVENTORY_ROW_GAP;
      const columnShift = Math.round(translationX / effectiveWidth);
      const rowShift = Math.round(translationY / effectiveHeight);
      const nextIndex =
        dragStartIndexRef.current + columnShift + rowShift * INVENTORY_COLUMNS;
      const listLength = filteredOwnedInventoryRef.current.length;

      if (listLength === 0) {
        return;
      }

      const boundedIndex = Math.max(0, Math.min(listLength - 1, nextIndex));

      if (boundedIndex === dragCurrentIndexRef.current) {
        return;
      }

      dragCurrentIndexRef.current = boundedIndex;
      commitInventoryReorder(activeId, boundedIndex);
    },
    [commitInventoryReorder]
  );

  const endInventoryDrag = useCallback(() => {
    if (!draggingInventoryIdRef.current) {
      return;
    }

    draggingInventoryIdRef.current = null;
    dragStartIndexRef.current = 0;
    dragCurrentIndexRef.current = 0;
    setDraggingInventoryId(null);
  }, []);

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
      setIsDrawingMode(false);
    },
    []
  );

  const handlePurchase = (emojiId: string) => {
    const success = purchaseEmoji(emojiId);

    if (!success) {
      Alert.alert('Not enough harvest', 'Gather more lettuce to purchase this decoration.');
    }
  };

  const handleSelectPenColor = useCallback(
    (color: string) => {
      setPenColor(color);
      setShowExtendedPalette(false);
      setIsDrawingMode(true);
    },
    [setIsDrawingMode, setShowExtendedPalette]
  );

  const handleClearDrawings = useCallback(() => {
    setStrokes([]);
    setCurrentStroke(null);
  }, []);

  const handleClearGarden = useCallback(() => {
    if (placements.length > 0) {
      clearGarden();
    }
    handleClearDrawings();
    setIsDrawingMode(false);
    setSelectedEmoji(null);
  }, [clearGarden, handleClearDrawings, placements, setIsDrawingMode]);

  const handleSaveSnapshot = useCallback(async () => {
    if (!canvasRef.current || isSavingSnapshot) {
      return;
    }

    const permission = await MediaLibrary.requestPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        'Permission needed',
        'Allow photo library access so we can save your garden to your device.'
      );
      return;
    }

    try {
      setIsSavingSnapshot(true);
      setPenHiddenForSave(true);
      await wait(80);
      const snapshotUri = await captureRef(canvasRef, { format: 'png', quality: 1 });
      await MediaLibrary.saveToLibraryAsync(snapshotUri);
      Alert.alert('Garden saved', 'Your garden snapshot is now in your photos.');
    } catch {
      Alert.alert('Save failed', 'We could not save the garden. Please try again.');
    } finally {
      setPenHiddenForSave(false);
      setIsSavingSnapshot(false);
    }
  }, [canvasRef, isSavingSnapshot]);

  const handleAddPhoto = useCallback(async () => {
    if (isPickingPhoto) {
      return;
    }

    try {
      setIsPickingPhoto(true);
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert('Permission needed', 'Enable photo access to add pictures to your garden.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      const uri = asset?.uri;

      if (!uri) {
        Alert.alert('Add photo failed', 'We could not read that photo. Please try another.');
        return;
      }

      const center = getCanvasCenter();
      const added = addPhotoPlacement(uri, center);
      if (added) {
        setShowPalette(false);
      }
    } catch {
      Alert.alert('Add photo failed', 'We could not open your photo library.');
    } finally {
      setIsPickingPhoto(false);
    }
  }, [addPhotoPlacement, getCanvasCenter, isPickingPhoto, setShowPalette]);

  const handleAddText = useCallback(() => {
    const trimmed = textDraft.replace(/\n+/g, ' ').trim();

    if (trimmed.length === 0) {
      return;
    }

    const color = penColor === ERASER_COLOR ? DEFAULT_TEXT_COLOR : penColor;
    const center = getCanvasCenter();
    const normalizedScale = clamp(textScale, TEXT_SCALE_MIN, TEXT_SCALE_MAX);
    const added = addTextPlacement(trimmed, center, color, selectedTextStyle, normalizedScale);

    if (added) {
      setTextDraft('');
      setShowPalette(false);
      Keyboard.dismiss();
    }
  }, [addTextPlacement, getCanvasCenter, penColor, selectedTextStyle, setShowPalette, textDraft, textScale]);

  const handleTextSliderChange = useCallback(
    (locationX: number) => {
      if (textSliderWidth <= 0) {
        return;
      }

      const ratio = clamp(locationX / textSliderWidth, 0, 1);
      const nextScale = TEXT_SCALE_MIN + ratio * (TEXT_SCALE_MAX - TEXT_SCALE_MIN);
      setTextScale(Number(nextScale.toFixed(2)));
    },
    [textSliderWidth]
  );

  const textScalePanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => {
          handleTextSliderChange(event.nativeEvent.locationX);
        },
        onPanResponderMove: (event) => {
          handleTextSliderChange(event.nativeEvent.locationX);
        },
        onPanResponderTerminationRequest: () => false,
      }),
    [handleTextSliderChange]
  );

  const handlePlacementDragBegin = useCallback(
    (placementId: string, center: { x: number; y: number }) => {
      if (isDrawingMode) {
        setIsDrawingMode(false);
      }

      setActiveDrag({ id: placementId, point: center });
    },
    [isDrawingMode]
  );

  const handlePlacementDragMove = useCallback((placementId: string, center: { x: number; y: number }) => {
    setActiveDrag({ id: placementId, point: center });
  }, []);

  const handlePlacementDragEnd = useCallback(
    (placementId: string, center: { x: number; y: number }) => {
      const shouldDelete = isPointInDeleteZone(center);

      if (shouldDelete) {
        removePlacement(placementId);
      }

      setActiveDrag(null);
    },
    [isPointInDeleteZone, removePlacement]
  );

  const renderStrokeSegments = useCallback(
    (stroke: Stroke, prefix: string) => {
      if (stroke.points.length === 0) {
        return [] as React.ReactElement[];
      }

      const segments: React.ReactElement[] = [];
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
      const strokeColor = penColor === ERASER_COLOR ? CANVAS_BACKGROUND : penColor;
      const stroke: Stroke = {
        id: `stroke-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        color: strokeColor,
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
      setIsDrawingGestureActive(true);
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
      setIsDrawingGestureActive(false);
      return;
    }

    endStroke();
    setIsDrawingGestureActive(false);
  }, [endStroke, isDrawingMode]);

  useEffect(() => {
    if (!isDrawingMode) {
      setCurrentStroke(null);
    }
  }, [isDrawingMode]);

  useEffect(() => {
    if (!isDrawingMode) {
      setIsDrawingGestureActive(false);
    }
  }, [isDrawingMode]);

  useEffect(() => {
    if (!showPalette) {
      setShowExtendedPalette(false);
      setFontDropdownOpen(false);
    }
  }, [showPalette]);

  const clampedTextScale = clamp(textScale, TEXT_SCALE_MIN, TEXT_SCALE_MAX);
  const textScaleRatio =
    TEXT_SCALE_MAX - TEXT_SCALE_MIN === 0
      ? 0
      : (clampedTextScale - TEXT_SCALE_MIN) / (TEXT_SCALE_MAX - TEXT_SCALE_MIN);
  const sliderTrackWidth = Math.max(textSliderWidth - 28, 0);
  const sliderFillWidth = Math.max(sliderTrackWidth * textScaleRatio, 0);
  const sliderThumbLeft = clamp(
    14 + sliderFillWidth - TEXT_SLIDER_THUMB_SIZE / 2,
    0,
    Math.max(textSliderWidth - TEXT_SLIDER_THUMB_SIZE, 0)
  );
  const selectedTextStyleOption = useMemo(
    () => TEXT_STYLE_OPTIONS.find((option) => option.id === selectedTextStyle) ?? TEXT_STYLE_OPTIONS[0],
    [selectedTextStyle]
  );

  const shouldShowCanvasEmptyState = useMemo(
    () => placements.length === 0 && strokes.length === 0 && !selectedEmoji,
    [placements.length, strokes.length, selectedEmoji]
  );
  const handleCloseSheet = useCallback(() => {
    setActiveSheet(null);
    setActiveEmojiPicker(null);
  }, []);
  const handleOpenSheet = useCallback((sheet: 'shop' | 'inventory') => setActiveSheet(sheet), []);
  const handleChangeCategory = useCallback(
    (category: CategoryFilter) => {
      setActiveCategory(category);
      endInventoryDrag();
    },
    [endInventoryDrag]
  );

  const keyExtractor = useCallback((item: InventoryEntry) => item.id, []);

  const bannerTopPadding = insets.top + 24;
  const contentBottomPadding = insets.bottom + 48;
  const canClearGarden = placements.length > 0 || strokes.length > 0;

  const renderShopItem: ListRenderItem<InventoryEntry> = ({ item }) => {
    const owned = item.owned;
    const isSelected = selectedEmoji === item.id;
    const canAfford = harvest >= item.cost;

    const handleTilePress = () => {
      if (owned > 0) {
        Alert.alert(
          'Find it in inventory',
          'Open your inventory to ready this decoration for placement.',
          [
            {
              text: 'Go to inventory',
              onPress: () => handleOpenSheet('inventory'),
            },
            {
              text: 'Close',
              style: 'cancel',
            },
          ]
        );
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
          <View style={[styles.emojiBadge, isSelected && styles.emojiBadgeSelected]}>
            <View style={[styles.emojiBadgeGlow, isSelected && styles.emojiBadgeGlowActive]} />
            <View style={[styles.emojiBadgeCore, isSelected && styles.emojiBadgeCoreSelected]}>
              <Text style={[styles.emojiGlyphLarge, isSelected && styles.emojiGlyphSelected]}>{item.emoji}</Text>
            </View>
          </View>
          <Text style={styles.emojiTileLabel} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={styles.emojiTileFooter}>
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
        </View>
      </View>
    );
  };

  const renderInventoryItem: ListRenderItem<InventoryEntry> = ({ item, index }) => {
    const isSelected = selectedEmoji === item.id;
    const categoryLabel = CATEGORY_LABELS[item.category];
    const isDragging = draggingInventoryId === item.id;
    const shouldShake = Boolean(draggingInventoryId);

    return (
      <InventoryTileItem
        key={item.id}
        item={item}
        index={index}
        isSelected={isSelected}
        isDragging={isDragging}
        categoryLabel={categoryLabel}
        canReorder={canReorderInventory}
        onSelect={handleSelect}
        onLayout={handleInventoryTileLayout}
        beginDrag={beginInventoryDrag}
        updateDrag={updateInventoryDrag}
        endDrag={endInventoryDrag}
        draggingIdRef={draggingInventoryIdRef}
        shouldShake={shouldShake}
      />
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.contentScroll}
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={[
          styles.contentScrollContent,
          {
            paddingTop: 0,
            paddingBottom: contentBottomPadding,
          },
        ]}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!isDrawingGestureActive}>
        <View style={[styles.harvestBanner, { paddingTop: bannerTopPadding }]}>
          <Text style={styles.harvestTitle}>Welcome to Lettuce Garden</Text>
          <Text style={styles.harvestAmount}>
            You have harvested {harvest.toLocaleString()} clicks.
          </Text>
          <Text style={styles.harvestHint}>
            Your harvest bankroll is ready—shop curated emoji sets and paint the garden to life.
          </Text>
        </View>

        <View style={styles.launcherRow}>
          <Pressable
            style={styles.launcherCard}
            onPress={() => handleOpenSheet('shop')}
            accessibilityLabel="Open the Garden shop">
            <Text style={styles.launcherIcon}>{shopEmoji}</Text>
            <Text style={styles.launcherHeading}>GardenShop</Text>
          </Pressable>
          <Pressable
            style={styles.launcherCard}
            onPress={() => handleOpenSheet('inventory')}
            accessibilityLabel="Open your inventory">
            <Text style={styles.launcherIcon}>{inventoryEmoji}</Text>
            <Text style={styles.launcherHeading}>Inventory</Text>
          </Pressable>
        </View>

        <View style={styles.selectionStatus}>
          {selectedDetails ? (
            <>
              <Text style={styles.selectionStatusTitle}>
                Ready to place {selectedDetails.emoji} {selectedDetails.name}
              </Text>
              <Text style={styles.selectionStatusCopy}>
                Tap the canvas to drop it. Single tap decorations to grow them, swipe up or down to fine-tune
                their size, pinch to resize, twist to rotate freely, and long press to shrink when fine tuning.
              </Text>
              <View style={styles.selectionStatusActions}>
                <Text style={styles.selectionStatusMeta}>
                  {(emojiInventory[selectedDetails.id] ?? 0).toLocaleString()} in inventory
                </Text>
                <Pressable
                  onPress={() => {
                    setSelectedEmoji(null);
                    setIsDrawingMode(false);
                  }}
                  style={styles.stopPlacingButton}>
                  <Text style={styles.stopPlacingText}>Stop placing</Text>
                </Pressable>
              </View>
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
            ref={canvasRef}
            style={styles.canvas}
            onLayout={handleCanvasLayout}
            onPress={handleCanvasPress}
            onTouchStart={handleCanvasTouchStart}
            onTouchMove={handleCanvasTouchMove}
            onTouchEnd={handleCanvasTouchEnd}
            onTouchCancel={handleCanvasTouchEnd}>
            <View pointerEvents="none" style={styles.drawingSurface}>
              {strokes.reduce<React.ReactElement[]>((acc, stroke) => {
                acc.push(...renderStrokeSegments(stroke, stroke.id));
                return acc;
              }, [])}
              {currentStroke ? renderStrokeSegments(currentStroke, `${currentStroke.id}-live`) : null}
            </View>
            {isDrawingMode && !penHiddenForSave ? (
              <View pointerEvents="none" style={styles.drawingModeBadge}>
                <Text style={styles.drawingModeBadgeText}>Drawing mode</Text>
              </View>
            ) : null}
            {shouldShowCanvasEmptyState ? (
              <View pointerEvents="none" style={styles.canvasEmptyState}>
                <Text style={styles.canvasEmptyTitle}>Tap the canvas to begin</Text>
                <Text style={styles.canvasEmptyCopy}>
                  Selected emoji, photos, or text will appear where you tap. Adjust them later by dragging,
                  pinching, twisting, double tapping, swiping, or long pressing.
                </Text>
              </View>
            ) : null}
            {placements.map((placement) => {
              if (placement.kind === 'emoji') {
                const emoji = emojiCatalog.find((item) => item.id === placement.emojiId);

                if (!emoji) {
                  return null;
                }

                return (
                <DraggablePlacement
                  key={placement.id}
                  placement={placement}
                  baseSize={EMOJI_SIZE}
                  onUpdate={(updates) => updatePlacement(placement.id, updates)}
                  onDragBegin={handlePlacementDragBegin}
                  onDragMove={handlePlacementDragMove}
                  onDragEnd={handlePlacementDragEnd}
                >
                  <Text style={styles.canvasEmojiGlyph}>{emoji.emoji}</Text>
                </DraggablePlacement>
              );
            }

              if (placement.kind === 'photo') {
                return (
                <DraggablePlacement
                  key={placement.id}
                  placement={placement}
                  baseSize={PHOTO_BASE_SIZE}
                  onUpdate={(updates) => updatePlacement(placement.id, updates)}
                  onDragBegin={handlePlacementDragBegin}
                  onDragMove={handlePlacementDragMove}
                  onDragEnd={handlePlacementDragEnd}
                >
                  <View style={styles.canvasPhotoFrame}>
                    <Image source={{ uri: placement.imageUri }} style={styles.canvasPhotoImage} />
                  </View>
                </DraggablePlacement>
                );
              }

              return (
                <DraggablePlacement
                  key={placement.id}
                  placement={placement}
                  baseSize={TEXT_BASE_SIZE}
                  onUpdate={(updates) => updatePlacement(placement.id, updates)}
                  onDragBegin={handlePlacementDragBegin}
                  onDragMove={handlePlacementDragMove}
                  onDragEnd={handlePlacementDragEnd}
                >
                  <Text
                    style={[
                      styles.canvasText,
                      TEXT_STYLE_MAP[placement.style ?? 'sprout'],
                      { color: placement.color ?? DEFAULT_TEXT_COLOR },
                    ]}
                  >
                    {placement.text}
                  </Text>
                </DraggablePlacement>
              );
            })}
            {!penHiddenForSave ? (
              <Pressable
                style={styles.penButton}
                accessibilityLabel={
                  deleteZoneVisible ? 'Trash can drop zone' : 'Open drawing palette'
                }
                accessibilityHint={
                  deleteZoneVisible
                    ? 'Drag an item here to delete it from the garden.'
                    : 'Opens options to pick colors and stroke sizes. Long press to exit drawing mode.'
                }
                onPress={() => {
                  if (deleteZoneVisible) {
                    return;
                  }

                  setShowExtendedPalette(false);
                  setShowPalette(true);
                }}
                onLongPress={() => {
                  if (deleteZoneVisible) {
                    return;
                  }
                  setIsDrawingMode(false);
                }}
                disabled={deleteZoneVisible}
                onLayout={({ nativeEvent }) => setPenButtonLayout(nativeEvent.layout)}
              >
                <View
                  style={[
                    styles.penButtonCircle,
                    isDrawingMode && !deleteZoneVisible && styles.penButtonCircleActive,
                    deleteZoneVisible && styles.penButtonCircleDelete,
                    shouldHighlightDeleteZone && styles.penButtonCircleDeleteActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.penButtonIcon,
                      isDrawingMode && !deleteZoneVisible && styles.penButtonIconActive,
                      deleteZoneVisible && styles.penButtonIconDelete,
                      shouldHighlightDeleteZone && styles.penButtonIconDeleteActive,
                    ]}
                  >
                    {deleteZoneVisible ? '🗑️' : '✏️'}
                  </Text>
                </View>
              </Pressable>
            ) : null}
          </Pressable>

          <View style={styles.canvasActions}>
            <Pressable
              style={[styles.ghostButton, !canClearGarden && styles.disabledSecondary]}
              disabled={!canClearGarden}
              onPress={handleClearGarden}>
              <Text style={[styles.ghostButtonText, !canClearGarden && styles.disabledText]}>
                Clear Garden
              </Text>
            </Pressable>
            <Pressable
              style={[styles.primaryButton, isSavingSnapshot && styles.primaryButtonDisabled]}
              onPress={handleSaveSnapshot}
              disabled={isSavingSnapshot}>
              <Text style={styles.primaryText}>{isSavingSnapshot ? 'Saving…' : 'Save'}</Text>
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
          <View
            style={[
              styles.paletteCard,
              { maxHeight: paletteMaxHeight, paddingBottom: palettePaddingBottom },
            ]}
          >
            <View style={styles.paletteHandle} />
            <Text style={styles.paletteTitle}>Garden Studio</Text>
            <Text style={styles.paletteSubtitle}>
              Tune your pen, lettering, and photo charms without leaving the garden.
            </Text>
            <ScrollView
              style={styles.paletteScroll}
              contentContainerStyle={styles.paletteScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.paletteSection}>
                <Text style={styles.paletteLabel}>Pen &amp; color</Text>
                <View style={styles.paletteColorRow}>
                  {QUICK_DRAW_COLORS.map((color) => {
                    const isActive = penColor === color;
                    return (
                      <Pressable
                        key={color}
                        style={[styles.colorSwatch, { backgroundColor: color }, isActive && styles.colorSwatchActive]}
                        onPress={() => handleSelectPenColor(color)}
                        accessibilityLabel={`Set pen color to ${color}`}
                      />
                    );
                  })}
                  <Pressable
                    key="eraser"
                    style={[styles.eraserSwatch, penColor === ERASER_COLOR && styles.colorSwatchActive]}
                    onPress={() => handleSelectPenColor(ERASER_COLOR)}
                    accessibilityLabel="Use eraser"
                  >
                    <Text style={styles.eraserIcon}>🧽</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.colorWheelButton, showExtendedPalette && styles.colorWheelButtonActive]}
                    onPress={() => setShowExtendedPalette((prev) => !prev)}
                    accessibilityLabel={showExtendedPalette ? 'Hide color wheel' : 'Show color wheel'}
                  >
                    <Text style={styles.colorWheelIcon}>🎨</Text>
                  </Pressable>
                </View>
                {showExtendedPalette ? (
                  <View style={styles.colorWheelWrap}>
                    <View style={styles.colorWheel}>
                      {colorWheelPositions.map(({ color, left, top }) => {
                        const isActive = penColor === color;
                        return (
                          <Pressable
                            key={color}
                            style={[styles.colorWheelSwatch, { backgroundColor: color, left, top }, isActive && styles.colorWheelSwatchActive]}
                            onPress={() => handleSelectPenColor(color)}
                            accessibilityLabel={`Set pen color to ${color}`}
                          />
                        );
                      })}
                      <Pressable
                        style={styles.colorWheelClose}
                        onPress={() => setShowExtendedPalette(false)}
                        accessibilityLabel="Collapse color wheel"
                      >
                        <Text style={styles.colorWheelCloseText}>Close</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : null}
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
                          {
                            width: size * 2,
                            height: size * 2,
                            borderRadius: size,
                            backgroundColor: penColor === ERASER_COLOR ? '#f1f5f9' : penColor,
                            borderColor: penColor === ERASER_COLOR ? '#94a3b8' : 'transparent',
                          },
                        ]}
                      />
                      <Text style={styles.sizeOptionLabel}>{size}px</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
              <View style={styles.paletteSection}>
                <Text style={styles.paletteLabel}>Sketchbook extras</Text>
                <View style={styles.additionsRow}>
                  <Pressable
                    style={[styles.additionCircle, isPickingPhoto && styles.additionCircleDisabled]}
                    onPress={handleAddPhoto}
                    disabled={isPickingPhoto}
                    accessibilityRole="button"
                    accessibilityLabel="Add a photo decoration"
                  >
                    <Text style={styles.additionCircleIcon}>🖼️</Text>
                  </Pressable>
                  <View style={styles.additionBody}>
                    <Text style={styles.additionTitle}>Photo charm</Text>
                    <Text style={styles.additionCopy}>
                      Drop a photo from your library onto the canvas.
                    </Text>
                  </View>
                </View>
                <View style={styles.textComposer}>
                  <Pressable
                    style={[
                      styles.fontPickerButton,
                      isFontDropdownOpen && styles.fontPickerButtonActive,
                    ]}
                    onPress={() => setFontDropdownOpen((prev) => !prev)}
                    accessibilityRole="button"
                    accessibilityLabel="Choose text style"
                    accessibilityState={{ expanded: isFontDropdownOpen }}
                  >
                    <View style={styles.fontPickerIconBubble}>
                      <Text style={styles.fontPickerIcon}>🔠</Text>
                    </View>
                    <View style={styles.fontPickerBody}>
                      <Text style={styles.fontPickerTitle}>Text style</Text>
                      <Text style={styles.fontPickerSubtitle} numberOfLines={1}>
                        {selectedTextStyleOption.label}
                      </Text>
                      <Text
                        style={[selectedTextStyleOption.textStyle, styles.fontPickerPreview]}
                        numberOfLines={1}
                      >
                        {selectedTextStyleOption.preview}
                      </Text>
                    </View>
                    <Text style={styles.fontPickerCaret}>{isFontDropdownOpen ? '▴' : '▾'}</Text>
                  </Pressable>
                  {isFontDropdownOpen ? (
                    <View style={styles.fontDropdownMenu}>
                      {TEXT_STYLE_OPTIONS.map((option) => {
                        const isActive = option.id === selectedTextStyle;
                        return (
                          <Pressable
                            key={option.id}
                            style={[
                              styles.fontOption,
                              styles.fontDropdownOption,
                              isActive && styles.fontOptionActive,
                            ]}
                            onPress={() => {
                              setSelectedTextStyle(option.id);
                              setFontDropdownOpen(false);
                            }}
                            accessibilityRole="button"
                            accessibilityState={{ selected: isActive }}
                            accessibilityLabel={`${option.label} text style`}
                          >
                            <Text
                              style={[option.textStyle, styles.fontOptionPreview]}
                              numberOfLines={1}
                            >
                              {option.preview}
                            </Text>
                            <Text
                              style={[styles.fontOptionLabel, isActive && styles.fontOptionLabelActive]}
                              numberOfLines={1}
                            >
                              {option.label}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  ) : null}
                  <Text style={styles.paletteLabel}>Text size</Text>
                  <View style={styles.textSizeControls}>
                    <Text style={styles.textSizeGlyphSmall}>A</Text>
                    <View
                      style={styles.textSizeSlider}
                      onLayout={({ nativeEvent }) => setTextSliderWidth(Math.max(nativeEvent.layout.width, 0))}
                      {...textScalePanResponder.panHandlers}
                      accessibilityRole="adjustable"
                      accessibilityLabel="Adjust text size"
                      accessibilityValue={{ text: `${Math.round(clampedTextScale * 100)} percent` }}
                    >
                      <View style={styles.textSizeSliderTrack} />
                      <View style={[styles.textSizeSliderFill, { width: sliderFillWidth }]} />
                      <View style={[styles.textSizeSliderThumb, { left: sliderThumbLeft }]} />
                    </View>
                    <Text style={styles.textSizeGlyphLarge}>A</Text>
                    <View style={styles.textSizeValuePill}>
                      <Text style={styles.textSizeValueText}>{Math.round(clampedTextScale * 100)}%</Text>
                    </View>
                  </View>
                  <TextInput
                    style={styles.textComposerInput}
                    value={textDraft}
                    onChangeText={setTextDraft}
                    placeholder="Write a garden note"
                    placeholderTextColor="#4a5568"
                    multiline
                    blurOnSubmit
                    returnKeyType="done"
                    onSubmitEditing={handleAddText}
                  />
                  <Pressable
                    style={[
                      styles.textComposerButton,
                      textDraft.trim().length === 0 && styles.textComposerButtonDisabled,
                    ]}
                    onPress={handleAddText}
                    disabled={textDraft.trim().length === 0}
                    accessibilityRole="button"
                    accessibilityLabel="Add a text decoration"
                  >
                    <Text
                      style={[
                        styles.textComposerButtonText,
                        textDraft.trim().length === 0 && styles.textComposerButtonTextDisabled,
                      ]}
                    >
                      Add text
                    </Text>
                  </Pressable>
                  <Text style={styles.textComposerHint}>
                    Uses the active pen color for the text fill. Swipe the size slider to grow or shrink your note.
                  </Text>
                </View>
              </View>
            </ScrollView>
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
            <View style={styles.sheetHeaderRow}>
              <Text style={styles.sheetTitle}>Garden shop</Text>
              <Pressable
                style={styles.sheetEmojiButton}
                onPress={() =>
                  setActiveEmojiPicker((prev) => (prev === 'shop' ? null : 'shop'))
                }
                accessibilityRole="button"
                accessibilityLabel="Change Garden shop icon"
              >
                <Text style={styles.sheetHeaderEmoji}>{shopEmoji}</Text>
              </Pressable>
            </View>
            {activeEmojiPicker === 'shop' ? (
              <View style={styles.sheetEmojiChooser}>
                {SHOP_EMOJI_CHOICES.map((emoji) => {
                  const isActive = shopEmoji === emoji;
                  return (
                    <Pressable
                      key={emoji}
                      style={[styles.sheetEmojiOption, isActive && styles.sheetEmojiOptionActive]}
                      onPress={() => {
                        setShopEmoji(emoji);
                        setActiveEmojiPicker(null);
                      }}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isActive }}
                      accessibilityLabel={`Use ${emoji} for GardenShop`}
                    >
                      <Text
                        style={[styles.sheetEmojiOptionText, isActive && styles.sheetEmojiOptionTextActive]}
                      >
                        {emoji}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}
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
                      onPress={() => handleChangeCategory(option.id)}
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
              style={styles.sheetList}
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
            <View style={styles.sheetHeaderRow}>
              <Text style={styles.sheetTitle}>Inventory</Text>
              <Pressable
                style={styles.sheetEmojiButton}
                onPress={() =>
                  setActiveEmojiPicker((prev) => (prev === 'inventory' ? null : 'inventory'))
                }
                accessibilityRole="button"
                accessibilityLabel="Change inventory icon"
              >
                <Text style={styles.sheetHeaderEmoji}>{inventoryEmoji}</Text>
              </Pressable>
            </View>
            {activeEmojiPicker === 'inventory' ? (
              <View style={styles.sheetEmojiChooser}>
                {INVENTORY_EMOJI_CHOICES.map((emoji) => {
                  const isActive = inventoryEmoji === emoji;
                  return (
                    <Pressable
                      key={emoji}
                      style={[styles.sheetEmojiOption, isActive && styles.sheetEmojiOptionActive]}
                      onPress={() => {
                        setInventoryEmoji(emoji);
                        setActiveEmojiPicker(null);
                      }}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isActive }}
                      accessibilityLabel={`Use ${emoji} for inventory`}
                    >
                      <Text
                        style={[styles.sheetEmojiOptionText, isActive && styles.sheetEmojiOptionTextActive]}
                      >
                        {emoji}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}
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
                      onPress={() => handleChangeCategory(option.id)}
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
              style={styles.sheetList}
              data={filteredOwnedInventory}
              renderItem={renderInventoryItem}
              keyExtractor={keyExtractor}
              numColumns={3}
              columnWrapperStyle={styles.sheetColumn}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.sheetListContent}
              scrollEnabled={!draggingInventoryId}
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
const PHOTO_BASE_SIZE = 150;
const TEXT_BASE_SIZE = 220;
const MIN_SCALE = 0.6;
const MAX_SCALE = 2.4;

type InventoryTileItemProps = {
  item: InventoryEntry;
  index: number;
  isSelected: boolean;
  isDragging: boolean;
  categoryLabel: string;
  canReorder: boolean;
  onSelect: (emojiId: string, owned: number) => void;
  onLayout: (event: LayoutChangeEvent) => void;
  beginDrag: (emojiId: string, index: number) => void;
  updateDrag: (dx: number, dy: number) => void;
  endDrag: () => void;
  draggingIdRef: React.MutableRefObject<string | null>;
  shouldShake: boolean;
};

function InventoryTileItem({
  item,
  index,
  isSelected,
  isDragging,
  categoryLabel,
  canReorder,
  onSelect,
  onLayout,
  beginDrag,
  updateDrag,
  endDrag,
  draggingIdRef,
  shouldShake,
}: InventoryTileItemProps) {
  const wiggle = useSharedValue(0);
  const scale = useSharedValue(isDragging ? 1.05 : 1);

  useEffect(() => {
    scale.value = withTiming(isDragging ? 1.05 : 1, { duration: 120 });
  }, [isDragging, scale]);

  useEffect(() => {
    if (shouldShake) {
      wiggle.value = withRepeat(withSequence(withTiming(-2.5, { duration: 120 }), withTiming(2.5, { duration: 120 })), -1, true);
    } else {
      cancelAnimation(wiggle);
      wiggle.value = withTiming(0, { duration: 150 });
    }
  }, [shouldShake, wiggle]);

  const longPressGesture = Gesture.LongPress()
    .minDuration(250)
    .onStart(() => {
      if (!canReorder) {
        return;
      }
      runOnJS(beginDrag)(item.id, index);
    })
    .onEnd(() => {
      if (!canReorder) {
        return;
      }
      runOnJS(endDrag)();
    })
    .onFinalize(() => {
      if (!canReorder) {
        return;
      }
      runOnJS(endDrag)();
    })
    .enabled(canReorder);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (!canReorder) {
        return;
      }
      runOnJS(updateDrag)(event.translationX, event.translationY);
    })
    .onEnd(() => {
      if (!canReorder) {
        return;
      }
      runOnJS(endDrag)();
    })
    .onFinalize(() => {
      if (!canReorder) {
        return;
      }
      runOnJS(endDrag)();
    })
    .enabled(canReorder);

  const combinedGesture = Gesture.Simultaneous(longPressGesture, panGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotateZ: `${wiggle.value}deg` }, { scale: scale.value }],
  }));

  return (
    <GestureDetector gesture={combinedGesture}>
      <Animated.View style={[styles.sheetTileWrapper, animatedStyle]}>
        <Pressable
          onLayout={onLayout}
          style={[styles.emojiTile, isSelected && styles.emojiTileSelected, isDragging && styles.emojiTileDragging]}
          onPress={() => {
            if (draggingIdRef.current) {
              return;
            }
            onSelect(item.id, item.owned);
          }}
          accessibilityLabel={`${item.name} emoji`}
          accessibilityHint="Select to ready this decoration."
        >
          <View style={[styles.emojiBadge, isSelected && styles.emojiBadgeSelected]}>
            <View style={[styles.emojiBadgeGlow, isSelected && styles.emojiBadgeGlowActive]} />
            <View style={[styles.emojiBadgeCore, isSelected && styles.emojiBadgeCoreSelected]}>
              <Text style={[styles.emojiGlyphLarge, isSelected && styles.emojiGlyphSelected]}>{item.emoji}</Text>
            </View>
          </View>
          {item.owned > 0 ? (
            <View style={styles.emojiTileBadge}>
              <Text style={styles.emojiTileBadgeText}>×{item.owned}</Text>
            </View>
          ) : null}
          <Text style={styles.emojiTileLabel} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={styles.emojiTileFooter}>
            <Text style={[styles.emojiTileMeta, styles.emojiTileCategory]} numberOfLines={1}>
              {categoryLabel}
            </Text>
            <Text style={[styles.emojiTileMeta, styles.inventoryMeta]} numberOfLines={1}>
              {item.owned.toLocaleString()} owned
            </Text>
          </View>
        </Pressable>
      </Animated.View>
    </GestureDetector>
  );
}

type DraggablePlacementProps = {
  placement: Placement;
  baseSize: number;
  onUpdate: (updates: Partial<Placement>) => void;
  children: ReactNode;
  onDragBegin?: (placementId: string, center: { x: number; y: number }) => void;
  onDragMove?: (placementId: string, center: { x: number; y: number }) => void;
  onDragEnd?: (placementId: string, center: { x: number; y: number }) => void;
  onLongPressChange?: (placementId: string, isActive: boolean) => void;
};

function DraggablePlacement({
  placement,
  onUpdate,
  baseSize,
  children,
  onDragBegin,
  onDragMove,
  onDragEnd,
  onLongPressChange,
}: DraggablePlacementProps) {
  const x = useSharedValue(placement.x);
  const y = useSharedValue(placement.y);
  const scale = useSharedValue(placement.scale ?? 1);
  const panStartX = useSharedValue(placement.x);
  const panStartY = useSharedValue(placement.y);
  const pinchStart = useSharedValue(placement.scale ?? 1);
  const rotation = useSharedValue(placement.rotation ?? 0);
  const rotationStart = useSharedValue(placement.rotation ?? 0);

  useEffect(() => {
    x.value = placement.x;
    y.value = placement.y;
    scale.value = placement.scale ?? 1;
    rotation.value = placement.rotation ?? 0;
  }, [placement.rotation, placement.x, placement.y, placement.scale, rotation, scale, x, y]);

  const reportUpdate = () => {
    'worklet';
    const nextScale = Math.min(Math.max(scale.value, MIN_SCALE), MAX_SCALE);
    scale.value = nextScale;
    runOnJS(onUpdate)({ x: x.value, y: y.value, scale: nextScale, rotation: rotation.value });
  };

  const panGesture = Gesture.Pan()
    .onStart(() => {
      panStartX.value = x.value;
      panStartY.value = y.value;
      if (onDragBegin) {
        runOnJS(onDragBegin)(placement.id, { x: x.value, y: y.value });
      }
    })
    .onChange((event) => {
      x.value = panStartX.value + event.translationX;
      y.value = panStartY.value + event.translationY;
      if (onDragMove) {
        runOnJS(onDragMove)(placement.id, { x: x.value, y: y.value });
      }
    })
    .onFinalize(() => {
      reportUpdate();
      if (onDragEnd) {
        runOnJS(onDragEnd)(placement.id, { x: x.value, y: y.value });
      }
    });

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

  const rotationGesture = Gesture.Rotation()
    .onStart(() => {
      rotationStart.value = rotation.value;
    })
    .onChange((event) => {
      rotation.value = rotationStart.value + (event.rotation * 180) / Math.PI;
    })
    .onEnd(reportUpdate)
    .onFinalize(reportUpdate);

  const singleTapGesture = Gesture.Tap()
    .numberOfTaps(1)
    .maxDuration(220)
    .onEnd(() => {
      scale.value = Math.min(scale.value * 1.12, MAX_SCALE);
      reportUpdate();
    });

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      scale.value = Math.min(scale.value * 1.25, MAX_SCALE);
      reportUpdate();
    });

  const longPressGesture = Gesture.LongPress()
    .minDuration(350)
    .onStart(() => {
      if (onLongPressChange) {
        runOnJS(onLongPressChange)(placement.id, true);
      }
    })
    .onEnd(() => {
      scale.value = Math.max(scale.value * 0.8, MIN_SCALE);
      reportUpdate();
    })
    .onFinalize(() => {
      if (onLongPressChange) {
        runOnJS(onLongPressChange)(placement.id, false);
      }
    });

  const tapGestures = Gesture.Exclusive(doubleTapGesture, singleTapGesture);

  const swipeUpGesture = Gesture.Fling()
    .direction(Directions.UP)
    .onEnd(() => {
      scale.value = Math.min(scale.value * 1.15, MAX_SCALE);
      reportUpdate();
    });

  const swipeDownGesture = Gesture.Fling()
    .direction(Directions.DOWN)
    .onEnd(() => {
      scale.value = Math.max(scale.value * 0.85, MIN_SCALE);
      reportUpdate();
    });

  const swipeLeftGesture = Gesture.Fling()
    .direction(Directions.LEFT)
    .onEnd(() => {
      rotation.value = rotation.value - 15;
      reportUpdate();
    });

  const swipeRightGesture = Gesture.Fling()
    .direction(Directions.RIGHT)
    .onEnd(() => {
      rotation.value = rotation.value + 15;
      reportUpdate();
    });

  const composedGesture = Gesture.Simultaneous(
    panGesture,
    pinchGesture,
    rotationGesture,
    tapGestures,
    longPressGesture,
    swipeUpGesture,
    swipeDownGesture,
    swipeLeftGesture,
    swipeRightGesture
  );

  const animatedStyle = useAnimatedStyle(() => {
    const clampedScale = Math.min(Math.max(scale.value, MIN_SCALE), MAX_SCALE);
    const halfSize = (baseSize * clampedScale) / 2;
    return {
      left: x.value - halfSize,
      top: y.value - halfSize,
      width: baseSize,
      height: baseSize,
      transform: [{ scale: clampedScale }, { rotate: `${rotation.value}deg` }],
    };
  });

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View style={[styles.canvasItem, animatedStyle]}>
        {children}
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
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 4,
    gap: 8,
    alignItems: 'center',
  },
  harvestTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f0fff4',
    textAlign: 'center',
  },
  harvestAmount: {
    fontSize: 24,
    fontWeight: '800',
    color: '#c6f6d5',
    textAlign: 'center',
  },
  harvestHint: {
    color: '#e6fffa',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  launcherRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  launcherCard: {
    flex: 1,
    backgroundColor: '#dbeafe',
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 18,
    gap: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0f172a',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 14,
    elevation: 4,
    minWidth: 160,
  },
  launcherIcon: {
    fontSize: 44,
    textAlign: 'center',
  },
  launcherHeading: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
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
  emojiTileDragging: {
    transform: [{ scale: 1.05 }],
    shadowOpacity: 0.28,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  emojiTileDisabled: {
    opacity: 0.55,
  },
  emojiBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    position: 'relative',
  },
  emojiBadgeGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 36,
    backgroundColor: 'rgba(56, 189, 248, 0.16)',
  },
  emojiBadgeGlowActive: {
    backgroundColor: 'rgba(34, 197, 94, 0.22)',
  },
  emojiBadgeCore: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(15, 118, 110, 0.25)',
    shadowColor: '#0f766e',
    shadowOpacity: 0.16,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  emojiBadgeCoreSelected: {
    backgroundColor: '#ecfdf3',
    borderColor: 'rgba(21, 128, 61, 0.45)',
  },
  emojiBadgeSelected: {
    shadowColor: '#0f172a',
  },
  emojiGlyphLarge: {
    fontSize: 34,
  },
  emojiGlyphSelected: {
    transform: [{ scale: 1.05 }],
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
    backgroundColor: '#047857',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  emojiTileBadgeText: {
    color: '#ffffff',
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
  selectionStatusActions: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectionStatusMeta: {
    fontSize: 12,
    color: '#0f766e',
    fontWeight: '600',
  },
  stopPlacingButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#0f766e',
  },
  stopPlacingText: {
    color: '#f0fff4',
    fontSize: 12,
    fontWeight: '700',
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
  canvasItem: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  canvasEmojiGlyph: {
    fontSize: 34,
  },
  canvasPhotoFrame: {
    width: '100%',
    height: '100%',
    borderRadius: 36,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(15, 118, 110, 0.35)',
    backgroundColor: '#ffffff',
  },
  canvasPhotoImage: {
    width: '100%',
    height: '100%',
  },
  canvasText: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
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
  penButtonCircleDelete: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: '#dc2626',
  },
  penButtonCircleDeleteActive: {
    backgroundColor: '#dc2626',
    borderColor: '#7f1d1d',
  },
  penButtonIcon: {
    fontSize: 26,
    color: '#1f6f4a',
  },
  penButtonIconActive: {
    color: '#f0fff4',
  },
  penButtonIconDelete: {
    color: '#dc2626',
  },
  penButtonIconDeleteActive: {
    color: '#fef2f2',
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
  primaryButtonDisabled: {
    backgroundColor: '#94a3b8',
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
    minHeight: '70%',
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
    fontSize: 20,
    fontWeight: '800',
    color: '#134e32',
  },
  sheetHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sheetEmojiButton: {
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#d1fae5',
  },
  sheetHeaderEmoji: {
    fontSize: 26,
  },
  sheetEmojiChooser: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingVertical: 6,
  },
  sheetEmojiOption: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  sheetEmojiOptionActive: {
    backgroundColor: '#22543d',
    borderColor: '#134e32',
  },
  sheetEmojiOptionText: {
    fontSize: 22,
  },
  sheetEmojiOptionTextActive: {
    color: '#f0fff4',
  },
  sheetSearchBlock: {
    gap: 8,
  },
  sheetColumn: {
    gap: 12,
    marginBottom: 12,
  },
  sheetList: {
    flexGrow: 0,
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
    width: '100%',
    justifyContent: 'center',
  },
  tileActionButton: {
    flex: 1,
    width: '100%',
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
    paddingBottom: 0,
    alignItems: 'stretch',
  },
  paletteBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  paletteCard: {
    backgroundColor: '#f8fffb',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 14,
    gap: 14,
    alignSelf: 'stretch',
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
    fontSize: 20,
    fontWeight: '800',
    color: '#0f5132',
    textAlign: 'left',
  },
  paletteSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: '#166534',
  },
  paletteScroll: {
    flexGrow: 0,
  },
  paletteScrollContent: {
    paddingBottom: 12,
    gap: 14,
  },
  paletteSection: {
    gap: 8,
  },
  paletteLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#134e32',
  },
  paletteColorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 10,
    rowGap: 10,
  },
  colorSwatch: {
    width: COLOR_WHEEL_SWATCH_SIZE,
    height: COLOR_WHEEL_SWATCH_SIZE,
    borderRadius: COLOR_WHEEL_SWATCH_SIZE / 2,
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
  eraserSwatch: {
    width: COLOR_WHEEL_SWATCH_SIZE,
    height: COLOR_WHEEL_SWATCH_SIZE,
    borderRadius: COLOR_WHEEL_SWATCH_SIZE / 2,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eraserIcon: {
    fontSize: 18,
    color: '#1f2937',
    fontWeight: '700',
  },
  colorWheelButton: {
    width: COLOR_WHEEL_SWATCH_SIZE,
    height: COLOR_WHEEL_SWATCH_SIZE,
    borderRadius: COLOR_WHEEL_SWATCH_SIZE / 2,
    borderWidth: 2,
    borderColor: '#1f6f4a',
    backgroundColor: '#fef9c3',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#facc15',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  colorWheelButtonActive: {
    borderColor: '#0f766e',
    backgroundColor: '#fef3c7',
  },
  colorWheelIcon: {
    fontSize: 20,
  },
  colorWheelWrap: {
    marginTop: 16,
    alignItems: 'center',
  },
  colorWheel: {
    width: COLOR_WHEEL_DIAMETER,
    height: COLOR_WHEEL_DIAMETER,
    borderRadius: COLOR_WHEEL_DIAMETER / 2,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#d1d5db',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    shadowColor: '#0f2e20',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  colorWheelSwatch: {
    position: 'absolute',
    width: COLOR_WHEEL_SWATCH_SIZE,
    height: COLOR_WHEEL_SWATCH_SIZE,
    borderRadius: COLOR_WHEEL_SWATCH_SIZE / 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorWheelSwatchActive: {
    borderColor: '#1f6f4a',
    shadowColor: '#1f6f4a',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  colorWheelClose: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#94a3b8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorWheelCloseText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
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
    borderWidth: 2,
  },
  sizeOptionLabel: {
    fontSize: 12,
    color: '#134e32',
    fontWeight: '600',
  },
  additionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 6,
  },
  additionCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ecfdf5',
    borderWidth: 2,
    borderColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0f172a',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  additionCircleDisabled: {
    opacity: 0.6,
  },
  additionCircleIcon: {
    fontSize: 30,
  },
  additionBody: {
    flex: 1,
    gap: 4,
  },
  additionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#14532d',
  },
  additionCopy: {
    fontSize: 13,
    color: '#1f2937',
    lineHeight: 18,
  },
  textComposer: {
    marginTop: 12,
    gap: 10,
  },
  fontPickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    backgroundColor: '#ffffff',
    shadowColor: '#0f172a',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  fontPickerButtonActive: {
    borderColor: '#0f766e',
    shadowOpacity: 0.1,
    backgroundColor: '#f0fdfa',
  },
  fontPickerIconBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fontPickerIcon: {
    fontSize: 22,
  },
  fontPickerBody: {
    flex: 1,
    gap: 2,
  },
  fontPickerTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#14532d',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  fontPickerSubtitle: {
    fontSize: 12,
    color: '#166534',
  },
  fontPickerPreview: {
    fontSize: 16,
    color: '#134e32',
  },
  fontPickerCaret: {
    fontSize: 18,
    color: '#134e32',
  },
  fontDropdownMenu: {
    marginTop: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    backgroundColor: '#ffffff',
    paddingVertical: 8,
    paddingHorizontal: 10,
    gap: 6,
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  fontDropdownOption: {
    width: '100%',
  },
  textComposerInput: {
    width: '100%',
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    color: '#134e32',
    textAlignVertical: 'top',
  },
  textComposerButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: '#15803d',
  },
  textComposerButtonDisabled: {
    backgroundColor: '#bbf7d0',
  },
  textComposerButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ecfdf5',
  },
  textComposerButtonTextDisabled: {
    color: '#166534',
  },
  fontOption: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    backgroundColor: '#ffffff',
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 4,
  },
  fontOptionActive: {
    borderColor: '#0f766e',
    backgroundColor: '#ecfdf5',
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  fontOptionPreview: {
    fontSize: 20,
    color: '#134e32',
    textAlign: 'center',
  },
  fontOptionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0f5132',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  fontOptionLabelActive: {
    color: '#0f766e',
  },
  textSizeControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  textSizeGlyphSmall: {
    fontSize: 14,
    color: '#0f5132',
    fontWeight: '700',
  },
  textSizeGlyphLarge: {
    fontSize: 24,
    color: '#0f5132',
    fontWeight: '700',
  },
  textSizeSlider: {
    flex: 1,
    height: 34,
    borderRadius: 18,
    backgroundColor: 'rgba(15, 118, 110, 0.12)',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  textSizeSliderTrack: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: 15,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(15, 118, 110, 0.25)',
  },
  textSizeSliderFill: {
    position: 'absolute',
    left: 16,
    top: 15,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#0f766e',
  },
  textSizeSliderThumb: {
    position: 'absolute',
    top: 5,
    width: TEXT_SLIDER_THUMB_SIZE,
    height: TEXT_SLIDER_THUMB_SIZE,
    borderRadius: TEXT_SLIDER_THUMB_SIZE / 2,
    backgroundColor: '#0f766e',
    shadowColor: '#0f766e',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  textSizeValuePill: {
    borderRadius: 14,
    backgroundColor: '#bbf7d0',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  textSizeValueText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#134e32',
  },
  textComposerHint: {
    fontSize: 12,
    color: '#1f2937',
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
