import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

export type HomeEmojiTheme = 'circle' | 'spiral' | 'matrix';

export type UpgradeDefinition = {
  id: string;
  name: string;
  description: string;
  cost: number;
  increment: number;
  emoji: string;
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
  scale: number;
};

type GameContextValue = {
  harvest: number;
  lifetimeHarvest: number;
  profileLifetimeTotal: number;
  tapValue: number;
  autoPerSecond: number;
  upgrades: UpgradeDefinition[];
  purchasedUpgrades: Record<string, number>;
  orbitingUpgradeEmojis: OrbitingEmoji[];
  emojiCatalog: EmojiDefinition[];
  emojiInventory: Record<string, number>;
  placements: Placement[];
  profileName: string;
  profileUsername: string;
  profileImageUri: string | null;
  homeEmojiTheme: HomeEmojiTheme;
  setProfileLifetimeTotal: (value: number) => void;
  addHarvest: () => void;
  purchaseUpgrade: (upgradeId: string) => boolean;
  purchaseEmoji: (emojiId: string) => boolean;
  placeEmoji: (emojiId: string, position: { x: number; y: number }) => boolean;
  updatePlacement: (placementId: string, updates: Partial<Placement>) => void;
  clearGarden: () => void;
  setProfileName: (value: string) => void;
  setProfileUsername: (value: string) => void;
  setProfileImageUri: (uri: string | null) => void;
  setHomeEmojiTheme: (theme: HomeEmojiTheme) => void;
};

const PROFILE_STORAGE_KEY = 'lettuce-click:profile';
const THEME_STORAGE_KEY = 'lettuce-click:emoji-theme';

const upgradeCatalog: UpgradeDefinition[] = [
  {
    id: 'watering-can',
    name: 'Watering Can',
    description: 'Adds +1 click per second with a gentle sprinkle.',
    cost: 50,
    increment: 1,
    emoji: '💧',
  },
  {
    id: 'gardeners-gloves',
    name: "Gardener's Gloves",
    description: 'Adds +5 clicks per second with perfect plucking form.',
    cost: 100,
    increment: 5,
    emoji: '🧤',
  },
  {
    id: 'sun-soaker',
    name: 'Sun Soaker Panels',
    description: 'Solar warmth adds +10 clicks per second.',
    cost: 400,
    increment: 10,
    emoji: '☀️',
  },
  {
    id: 'greenhouse',
    name: 'Mini Greenhouse',
    description: 'Climate control adds +20 clicks per second.',
    cost: 600,
    increment: 20,
    emoji: '🏡',
  },
  {
    id: 'irrigation',
    name: 'Irrigation Network',
    description: 'A flowing network adds +35 clicks per second.',
    cost: 1200,
    increment: 35,
    emoji: '🚿',
  },
  {
    id: 'pollinator-drones',
    name: 'Pollinator Drones',
    description: 'Autonomous helpers add +75 clicks per second.',
    cost: 5000,
    increment: 75,
    emoji: '🛸',
  },
  {
    id: 'soil-lab',
    name: 'Soil Enrichment Lab',
    description: 'Lab-grown compost adds +150 clicks per second.',
    cost: 12000,
    increment: 150,
    emoji: '🧪',
  },
  {
    id: 'weather-dome',
    name: 'Weather Dome',
    description: 'Precision weather control adds +400 clicks per second.',
    cost: 55000,
    increment: 400,
    emoji: '🌦️',
  },
  {
    id: 'quantum-growlights',
    name: 'Quantum Growlights',
    description: 'Quantum illumination adds +1,200 clicks per second.',
    cost: 250000,
    increment: 1200,
    emoji: '💡',
  },
  {
    id: 'hydroponic-spire',
    name: 'Hydroponic Spire',
    description: 'Vertical farms add +4,500 clicks per second.',
    cost: 1250000,
    increment: 4500,
    emoji: '🏙️',
  },
  {
    id: 'bioengineered-forest',
    name: 'Bioengineered Forest',
    description: 'Designer ecosystems add +18,000 clicks per second.',
    cost: 7500000,
    increment: 18000,
    emoji: '🧬',
  },
  {
    id: 'orbital-greenhouse',
    name: 'Orbital Greenhouse',
    description: 'Low-gravity growth adds +75,000 clicks per second.',
    cost: 42000000,
    increment: 75000,
    emoji: '🛰️',
  },
  {
    id: 'terraforming-fleet',
    name: 'Terraforming Fleet',
    description: 'Planet-scale gardeners add +320,000 clicks per second.',
    cost: 195000000,
    increment: 320000,
    emoji: '🚀',
  },
  {
    id: 'galactic-arborists',
    name: 'Galactic Arborists Guild',
    description: 'Interstellar caretakers add +1,350,000 clicks per second.',
    cost: 650000000,
    increment: 1350000,
    emoji: '🌌',
  },
  {
    id: 'cosmic-bloom',
    name: 'Cosmic Bloom Engine',
    description: 'Reality-bending growth adds +5,500,000 clicks per second.',
    cost: 1000000000,
    increment: 5500000,
    emoji: '🪐',
  },
];

const gardenEmojiCatalog: EmojiDefinition[] = [
  { id: 'sprout', emoji: '🌱', name: 'Sprout', cost: 25 },
  { id: 'seedling', emoji: '🪴', name: 'Potted Seedling', cost: 60 },
  { id: 'butterfly', emoji: '🦋', name: 'Butterfly', cost: 90 },
  { id: 'ladybug', emoji: '🐞', name: 'Ladybug', cost: 120 },
  { id: 'honeybee', emoji: '🐝', name: 'Honeybee', cost: 150 },
  { id: 'snail', emoji: '🐌', name: 'Helpful Snail', cost: 200 },
  { id: 'frog', emoji: '🐸', name: 'Lily Pad Frog', cost: 260 },
  { id: 'hedgehog', emoji: '🦔', name: 'Hedgehog Friend', cost: 320 },
  { id: 'fox', emoji: '🦊', name: 'Fox Visitor', cost: 380 },
  { id: 'owl', emoji: '🦉', name: 'Wise Owl', cost: 420 },
  { id: 'cat', emoji: '🐱', name: 'Garden Cat', cost: 460 },
  { id: 'dog', emoji: '🐶', name: 'Puppy Pal', cost: 500 },
  { id: 'flamingo', emoji: '🦩', name: 'Flamingo Flair', cost: 560 },
  { id: 'peacock', emoji: '🦚', name: 'Peacock Parade', cost: 600 },
  { id: 'koala', emoji: '🐨', name: 'Koala Companion', cost: 640 },
  { id: 'unicorn', emoji: '🦄', name: 'Mythic Unicorn', cost: 650 },
  { id: 'rainbow', emoji: '🌈', name: 'Prismatic Rainbow', cost: 700 },
  { id: 'sparkles', emoji: '✨', name: 'Sparkle Dust', cost: 750 },
  { id: 'star', emoji: '⭐️', name: 'Shooting Star', cost: 800 },
  { id: 'moon', emoji: '🌙', name: 'Moonbeam', cost: 840 },
  { id: 'meteor', emoji: '☄️', name: 'Meteor Trail', cost: 900 },
  { id: 'crystal', emoji: '🔮', name: 'Crystal Glow', cost: 940 },
  { id: 'lantern', emoji: '🏮', name: 'Lantern Light', cost: 980 },
  { id: 'bonsai', emoji: '🌳', name: 'Bonsai Tree', cost: 1040 },
];

export type OrbitingEmoji = {
  id: string;
  emoji: string;
};

const GameContext = createContext<GameContextValue | undefined>(undefined);

export const GameProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [harvest, setHarvest] = useState(0);
  const [lifetimeHarvest, setLifetimeHarvest] = useState(0);
  const [profileLifetimeTotal, setProfileLifetimeTotal] = useState(0);
  const [tapValue] = useState(1);
  const [autoPerSecond, setAutoPerSecond] = useState(0);
  const [purchasedUpgrades, setPurchasedUpgrades] = useState<Record<string, number>>({});
  const [orbitingUpgradeEmojis, setOrbitingUpgradeEmojis] = useState<OrbitingEmoji[]>([]);
  const [emojiInventory, setEmojiInventory] = useState<Record<string, number>>({});
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [profileName, setProfileName] = useState('');
  const [profileUsername, setProfileUsername] = useState('');
  const [profileImageUri, setProfileImageUri] = useState<string | null>(null);
  const [homeEmojiTheme, setHomeEmojiTheme] = useState<HomeEmojiTheme>('circle');
  const initialisedRef = useRef(false);

  useEffect(() => {
    if (autoPerSecond <= 0) {
      return;
    }

    const interval = setInterval(() => {
      setHarvest((prev) => prev + autoPerSecond);
      setLifetimeHarvest((prev) => prev + autoPerSecond);
      setProfileLifetimeTotal((prev) => prev + autoPerSecond);
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
    setProfileLifetimeTotal((prev) => prev + tapValue);
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

    setAutoPerSecond((prev) => prev + upgrade.increment);
    setOrbitingUpgradeEmojis((prev) => {
      const entry: OrbitingEmoji = {
        id: `${upgrade.id}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        emoji: upgrade.emoji,
      };
      const next = [...prev, entry];
      if (next.length > 100) {
        return next.slice(next.length - 100);
      }
      return next;
    });

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
        scale: 1,
      },
    ]);

    return true;
  };

  const updatePlacement = (placementId: string, updates: Partial<Placement>) => {
    setPlacements((prev) =>
      prev.map((placement) =>
        placement.id === placementId
          ? {
              ...placement,
              ...updates,
            }
          : placement
      )
    );
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
    profileLifetimeTotal,
    tapValue,
    autoPerSecond,
    upgrades: upgradeCatalog,
    purchasedUpgrades,
    orbitingUpgradeEmojis,
    emojiCatalog: gardenEmojiCatalog,
    emojiInventory,
    placements,
    profileName,
    profileUsername,
    profileImageUri,
    homeEmojiTheme,
    setProfileLifetimeTotal,
    addHarvest,
    purchaseUpgrade,
    purchaseEmoji,
    placeEmoji,
    updatePlacement,
    clearGarden,
    setProfileName,
    setProfileUsername,
    setProfileImageUri,
    setHomeEmojiTheme,
  }), [
    harvest,
    lifetimeHarvest,
    profileLifetimeTotal,
    tapValue,
    autoPerSecond,
    purchasedUpgrades,
    orbitingUpgradeEmojis,
    emojiInventory,
    placements,
    profileName,
    profileUsername,
    profileImageUri,
    homeEmojiTheme,
    setProfileLifetimeTotal,
  ]);

  useEffect(() => {
    if (initialisedRef.current) {
      return;
    }

    AsyncStorage.multiGet([PROFILE_STORAGE_KEY, THEME_STORAGE_KEY])
      .then(([profileEntry, themeEntry]) => {
        if (profileEntry[1]) {
          try {
            const parsed = JSON.parse(profileEntry[1]) as {
              name?: string;
              username?: string;
              imageUri?: string | null;
              lifetimeTotal?: number;
            };
            setProfileName(parsed.name ?? '');
            setProfileUsername(parsed.username ?? '');
            setProfileImageUri(parsed.imageUri ?? null);
            setProfileLifetimeTotal(parsed.lifetimeTotal ?? 0);
          } catch (error) {
            // ignore malformed stored data
          }
        }

        if (themeEntry[1]) {
          if (themeEntry[1] === 'circle' || themeEntry[1] === 'spiral' || themeEntry[1] === 'matrix') {
            setHomeEmojiTheme(themeEntry[1]);
          }
        }
      })
      .finally(() => {
        initialisedRef.current = true;
      });
  }, []);

  useEffect(() => {
    if (!initialisedRef.current) {
      return;
    }

    const payload = JSON.stringify({
      name: profileName,
      username: profileUsername,
      imageUri: profileImageUri,
      lifetimeTotal: profileLifetimeTotal,
    });

    AsyncStorage.setItem(PROFILE_STORAGE_KEY, payload).catch(() => {
      // persistence best effort only
    });
  }, [profileImageUri, profileLifetimeTotal, profileName, profileUsername]);

  useEffect(() => {
    if (!initialisedRef.current) {
      return;
    }

    AsyncStorage.setItem(THEME_STORAGE_KEY, homeEmojiTheme).catch(() => {
      // persistence best effort only
    });
  }, [homeEmojiTheme]);

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

export const useGame = () => {
  const context = useContext(GameContext);

  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }

  return context;
};
