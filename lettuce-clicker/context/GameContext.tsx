import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type UpgradeDefinition = {
  id: string;
  name: string;
  description: string;
  cost: number;
  type: 'auto' | 'tap';
  increment: number;
};

export type EmojiDefinition = {
  id: string;
  emoji: string;
  name: string;
  cost: number;
};

export type Placement = {
  id: string;
  emojiId: string;
  x: number;
  y: number;
};

type GameContextValue = {
  harvest: number;
  lifetimeHarvest: number;
  tapValue: number;
  autoPerSecond: number;
  upgrades: UpgradeDefinition[];
  purchasedUpgrades: Record<string, number>;
  emojiCatalog: EmojiDefinition[];
  emojiInventory: Record<string, number>;
  placements: Placement[];
  addHarvest: () => void;
  purchaseUpgrade: (upgradeId: string) => boolean;
  purchaseEmoji: (emojiId: string) => boolean;
  placeEmoji: (emojiId: string, position: { x: number; y: number }) => boolean;
  clearGarden: () => void;
};

const upgradeCatalog: UpgradeDefinition[] = [
  {
    id: 'watering-can',
    name: 'Watering Can',
    description: 'Adds +1 harvest per second with a gentle sprinkle.',
    cost: 50,
    type: 'auto',
    increment: 1,
  },
  {
    id: 'gardeners-gloves',
    name: "Gardener's Gloves",
    description: 'Boost tap value by +1 for every careful pluck.',
    cost: 100,
    type: 'tap',
    increment: 1,
  },
  {
    id: 'sun-soaker',
    name: 'Sun Soaker Panels',
    description: 'Solar warmth grants +5 harvest per second.',
    cost: 400,
    type: 'auto',
    increment: 5,
  },
  {
    id: 'greenhouse',
    name: 'Mini Greenhouse',
    description: 'Doubles your tap value with a climate-controlled boost.',
    cost: 600,
    type: 'tap',
    increment: 5,
  },
  {
    id: 'irrigation',
    name: 'Irrigation Network',
    description: 'Adds +15 harvest per second with automated watering.',
    cost: 1200,
    type: 'auto',
    increment: 15,
  },
];

const gardenEmojiCatalog: EmojiDefinition[] = [
  { id: 'sprout', emoji: '🌱', name: 'Sprout', cost: 25 },
  { id: 'seedling', emoji: '🪴', name: 'Potted Seedling', cost: 75 },
  { id: 'butterfly', emoji: '🦋', name: 'Butterfly', cost: 120 },
  { id: 'snail', emoji: '🐌', name: 'Helpful Snail', cost: 200 },
  { id: 'hedgehog', emoji: '🦔', name: 'Hedgehog Friend', cost: 350 },
];

const GameContext = createContext<GameContextValue | undefined>(undefined);

export const GameProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [harvest, setHarvest] = useState(0);
  const [lifetimeHarvest, setLifetimeHarvest] = useState(0);
  const [tapValue, setTapValue] = useState(1);
  const [autoPerSecond, setAutoPerSecond] = useState(0);
  const [purchasedUpgrades, setPurchasedUpgrades] = useState<Record<string, number>>({});
  const [emojiInventory, setEmojiInventory] = useState<Record<string, number>>({});
  const [placements, setPlacements] = useState<Placement[]>([]);

  useEffect(() => {
    if (autoPerSecond <= 0) {
      return;
    }

    const interval = setInterval(() => {
      setHarvest((prev) => prev + autoPerSecond);
      setLifetimeHarvest((prev) => prev + autoPerSecond);
    }, 1000);

    return () => clearInterval(interval);
  }, [autoPerSecond]);

  const spendHarvest = (amount: number) => {
    if (harvest < amount) {
      return false;
    }

    setHarvest((prev) => prev - amount);
    return true;
  };

  const addHarvest = () => {
    setHarvest((prev) => prev + tapValue);
    setLifetimeHarvest((prev) => prev + tapValue);
  };

  const purchaseUpgrade = (upgradeId: string) => {
    const upgrade = upgradeCatalog.find((item) => item.id === upgradeId);

    if (!upgrade) {
      return false;
    }

    if (!spendHarvest(upgrade.cost)) {
      return false;
    }

    setPurchasedUpgrades((prev) => ({
      ...prev,
      [upgradeId]: (prev[upgradeId] ?? 0) + 1,
    }));

    if (upgrade.type === 'auto') {
      setAutoPerSecond((prev) => prev + upgrade.increment);
    } else {
      setTapValue((prev) => prev + upgrade.increment);
    }

    return true;
  };

  const purchaseEmoji = (emojiId: string) => {
    const emoji = gardenEmojiCatalog.find((item) => item.id === emojiId);

    if (!emoji) {
      return false;
    }

    if (!spendHarvest(emoji.cost)) {
      return false;
    }

    setEmojiInventory((prev) => ({
      ...prev,
      [emojiId]: (prev[emojiId] ?? 0) + 1,
    }));

    return true;
  };

  const placeEmoji = (emojiId: string, position: { x: number; y: number }) => {
    const available = emojiInventory[emojiId] ?? 0;

    if (available <= 0) {
      return false;
    }

    setEmojiInventory((prev) => ({
      ...prev,
      [emojiId]: Math.max((prev[emojiId] ?? 0) - 1, 0),
    }));

    setPlacements((prev) => [
      ...prev,
      {
        id: `${emojiId}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        emojiId,
        x: position.x,
        y: position.y,
      },
    ]);

    return true;
  };

  const clearGarden = () => {
    setPlacements((prevPlacements) => {
      if (prevPlacements.length === 0) {
        return prevPlacements;
      }

      setEmojiInventory((prevInventory) => {
        const restored = { ...prevInventory };
        prevPlacements.forEach(({ emojiId }) => {
          restored[emojiId] = (restored[emojiId] ?? 0) + 1;
        });
        return restored;
      });

      return [];
    });
  };

  const value = useMemo<GameContextValue>(() => ({
    harvest,
    lifetimeHarvest,
    tapValue,
    autoPerSecond,
    upgrades: upgradeCatalog,
    purchasedUpgrades,
    emojiCatalog: gardenEmojiCatalog,
    emojiInventory,
    placements,
    addHarvest,
    purchaseUpgrade,
    purchaseEmoji,
    placeEmoji,
    clearGarden,
  }), [
    harvest,
    lifetimeHarvest,
    tapValue,
    autoPerSecond,
    purchasedUpgrades,
    emojiInventory,
    placements,
  ]);

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

export const useGame = () => {
  const context = useContext(GameContext);

  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }

  return context;
};
