import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { gardenEmojiCatalog } from '@/constants/emojiCatalog';
import { AppState, AppStateStatus } from 'react-native';

export type HomeEmojiTheme = 'circle' | 'spiral' | 'matrix' | 'clear';

export type UpgradeDefinition = {
  id: string;
  name: string;
  description: string;
  cost: number;
  increment: number;
  emoji: string;
};

export type EmojiCategory = 'plants' | 'scenery' | 'creatures' | 'features' | 'accents';

export type EmojiDefinition = {
  id: string;
  emoji: string;
  name: string;
  cost: number;
  category: EmojiCategory;
  tags: string[];
  popularity: number;
};

export type Placement = {
  id: string;
  emojiId: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
};

type ResumeNoticeBase = {
  timestamp: number;
  harvestSnapshot: number;
  lifetimeHarvestSnapshot: number;
  autoPerSecondSnapshot: number;
};

type PassiveResumeNotice =
  | (ResumeNoticeBase & {
      type: 'returning';
      lifetimeHarvest: number;
    })
  | (ResumeNoticeBase & {
      type: 'background';
      passiveHarvest: number;
      greeting: string;
    });

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
  resumeNotice: PassiveResumeNotice | null;
  registerCustomEmoji: (emoji: string) => EmojiDefinition | null;
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
  clearResumeNotice: () => void;
};

const PROFILE_STORAGE_KEY = 'lettuce-click:profile';
const THEME_STORAGE_KEY = 'lettuce-click:emoji-theme';
const GAME_STORAGE_KEY = 'lettuce-click:game';
const LAST_EXIT_STORAGE_KEY = 'lettuce-click:last-exit';

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

export type OrbitingEmoji = {
  id: string;
  emoji: string;
};

type StoredGameState = {
  harvest: number;
  lifetimeHarvest: number;
  purchasedUpgrades: Record<string, number>;
  emojiInventory: Record<string, number>;
  placements: Placement[];
  orbitingUpgradeEmojis: OrbitingEmoji[];
  customEmojiCatalog?: Record<string, EmojiDefinition>;
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
  const [resumeNotice, setResumeNotice] = useState<PassiveResumeNotice | null>(null);
  const [customEmojiCatalog, setCustomEmojiCatalog] = useState<Record<string, EmojiDefinition>>({});
  const initialisedRef = useRef(false);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const backgroundInfoRef = useRef<
    | {
        timestamp: number;
        harvest: number;
        lifetimeHarvest: number;
        profileLifetimeTotal: number;
        autoPerSecond: number;
      }
    | null
  >(null);
  const harvestRef = useRef(harvest);
  const lifetimeHarvestRef = useRef(lifetimeHarvest);
  const profileLifetimeTotalRef = useRef(profileLifetimeTotal);
  const autoPerSecondRef = useRef(autoPerSecond);
  const VARIATION_SELECTOR_REGEX = /[\uFE0E\uFE0F]/g;

  const stripVariationSelectors = useCallback(
    (value: string) => value.replace(VARIATION_SELECTOR_REGEX, ''),
    []
  );

  const computeCustomEmojiCost = useCallback((emojiValue: string) => {
    const codePoints = Array.from(emojiValue).map((char) => char.codePointAt(0) ?? 0);

    if (codePoints.length === 0) {
      return 120;
    }

    const total = codePoints.reduce((sum, point) => sum + point, 0);
    const base = 90;
    const spread = 360;
    return base + (total % spread);
  }, []);

  const pickCustomCategory = useCallback((emojiValue: string): EmojiCategory => {
    const categories: EmojiCategory[] = ['plants', 'scenery', 'creatures', 'features', 'accents'];
    const codePoints = Array.from(emojiValue).map((char) => char.codePointAt(0) ?? 0);

    if (codePoints.length === 0) {
      return 'accents';
    }

    const total = codePoints.reduce((sum, point) => sum + point, 0);
    return categories[total % categories.length];
  }, []);

  const registerCustomEmoji = useCallback(
    (emoji: string): EmojiDefinition | null => {
      const trimmed = emoji.trim();

      if (trimmed.length === 0) {
        return null;
      }

      const normalized = stripVariationSelectors(trimmed);

      if (normalized.length === 0) {
        return null;
      }

      const idFragment = Array.from(normalized)
        .map((char) => {
          const codePoint = char.codePointAt(0);
          return codePoint ? codePoint.toString(16) : null;
        })
        .filter((value): value is string => Boolean(value))
        .join('-');

      if (!idFragment) {
        return null;
      }

      const customId = `custom-${idFragment}`;

      if (customEmojiCatalog[customId]) {
        return customEmojiCatalog[customId];
      }

      let createdDefinition: EmojiDefinition | null = null;

      setCustomEmojiCatalog((prev) => {
        if (prev[customId]) {
          createdDefinition = prev[customId];
          return prev;
        }

        const nextDefinition: EmojiDefinition = {
          id: customId,
          emoji: trimmed,
          name: `Garden Emoji ${trimmed}`,
          cost: computeCustomEmojiCost(normalized),
          category: pickCustomCategory(normalized),
          tags: [trimmed.toLowerCase(), normalized.toLowerCase(), 'custom emoji'],
          popularity: 1000 + Object.keys(prev).length,
        };

        createdDefinition = nextDefinition;
        return { ...prev, [customId]: nextDefinition };
      });

      return createdDefinition;
    },
    [computeCustomEmojiCost, customEmojiCatalog, pickCustomCategory, stripVariationSelectors]
  );

  const combinedEmojiCatalog = useMemo(
    () => [...gardenEmojiCatalog, ...Object.values(customEmojiCatalog)],
    [customEmojiCatalog]
  );

  const findEmojiDefinition = useCallback(
    (emojiId: string) => combinedEmojiCatalog.find((item) => item.id === emojiId) ?? null,
    [combinedEmojiCatalog]
  );

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

  useEffect(() => {
    harvestRef.current = harvest;
  }, [harvest]);

  useEffect(() => {
    lifetimeHarvestRef.current = lifetimeHarvest;
  }, [lifetimeHarvest]);

  useEffect(() => {
    profileLifetimeTotalRef.current = profileLifetimeTotal;
  }, [profileLifetimeTotal]);

  useEffect(() => {
    autoPerSecondRef.current = autoPerSecond;
  }, [autoPerSecond]);

  useEffect(() => {
    const backgroundStates: AppStateStatus[] = ['inactive', 'background'];

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      const previousState = appStateRef.current;
      appStateRef.current = nextAppState;

      if (!initialisedRef.current) {
        return;
      }

      const movingToBackground = previousState === 'active' && backgroundStates.includes(nextAppState);
      const movingToForeground = backgroundStates.includes(previousState) && nextAppState === 'active';

      if (movingToBackground) {
        backgroundInfoRef.current = {
          timestamp: Date.now(),
          harvest: harvestRef.current,
          lifetimeHarvest: lifetimeHarvestRef.current,
          profileLifetimeTotal: profileLifetimeTotalRef.current,
          autoPerSecond: autoPerSecondRef.current,
        };

        AsyncStorage.setItem(LAST_EXIT_STORAGE_KEY, Date.now().toString()).catch(() => {
          // persistence best effort only
        });
        return;
      }

      if (movingToForeground) {
        AsyncStorage.removeItem(LAST_EXIT_STORAGE_KEY).catch(() => {
          // persistence best effort only
        });

        const info = backgroundInfoRef.current;
        backgroundInfoRef.current = null;

        if (!info) {
          return;
        }

        const elapsedSeconds = Math.max(Math.floor((Date.now() - info.timestamp) / 1000), 0);
        const passiveHarvest = elapsedSeconds * Math.max(info.autoPerSecond, 0);
        const greetings = ['Hi', 'Howdy', "What's Up", 'Hello'] as const;
        const greeting = greetings[Math.floor(Math.random() * greetings.length) % greetings.length];

        const harvestSnapshot = info.harvest + passiveHarvest;
        const lifetimeSnapshot = info.lifetimeHarvest + passiveHarvest;

        if (passiveHarvest > 0) {
          setHarvest((prev) => prev + passiveHarvest);
          setLifetimeHarvest((prev) => prev + passiveHarvest);
          setProfileLifetimeTotal((prev) => prev + passiveHarvest);
        }

        setResumeNotice({
          type: 'background',
          passiveHarvest,
          greeting,
          timestamp: Date.now(),
          harvestSnapshot,
          lifetimeHarvestSnapshot: lifetimeSnapshot,
          autoPerSecondSnapshot: info.autoPerSecond,
        });
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, []);

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
    const emoji = findEmojiDefinition(emojiId);

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
        rotation: 0,
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
    emojiCatalog: combinedEmojiCatalog,
    emojiInventory,
    placements,
    profileName,
    profileUsername,
    profileImageUri,
    homeEmojiTheme,
    resumeNotice,
    registerCustomEmoji,
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
    clearResumeNotice: () => setResumeNotice(null),
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
    resumeNotice,
    combinedEmojiCatalog,
    registerCustomEmoji,
  ]);

  useEffect(() => {
    if (initialisedRef.current) {
      return;
    }

    AsyncStorage.multiGet([PROFILE_STORAGE_KEY, THEME_STORAGE_KEY, GAME_STORAGE_KEY, LAST_EXIT_STORAGE_KEY])
      .then(([profileEntry, themeEntry, gameEntry, exitEntry]) => {
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
          if (
            themeEntry[1] === 'circle' ||
            themeEntry[1] === 'spiral' ||
            themeEntry[1] === 'matrix' ||
            themeEntry[1] === 'clear'
          ) {
            setHomeEmojiTheme(themeEntry[1]);
          }
        }

        let loadedLifetimeHarvest: number | undefined;
        let loadedHarvest: number | undefined;
        let loadedAutoPerSecond = 0;

        if (gameEntry[1]) {
          try {
            const parsed = JSON.parse(gameEntry[1]) as Partial<StoredGameState>;
            if (typeof parsed.harvest === 'number' && Number.isFinite(parsed.harvest)) {
              setHarvest(parsed.harvest);
              loadedHarvest = parsed.harvest;
            }
            if (typeof parsed.lifetimeHarvest === 'number' && Number.isFinite(parsed.lifetimeHarvest)) {
              setLifetimeHarvest(parsed.lifetimeHarvest);
              loadedLifetimeHarvest = parsed.lifetimeHarvest;
            }
            if (parsed.purchasedUpgrades && typeof parsed.purchasedUpgrades === 'object') {
              setPurchasedUpgrades(parsed.purchasedUpgrades);
              const computedAuto = Object.entries(parsed.purchasedUpgrades).reduce((total, [upgradeId, count]) => {
                const upgrade = upgradeCatalog.find((item) => item.id === upgradeId);
                if (!upgrade || typeof count !== 'number') {
                  return total;
                }
                return total + upgrade.increment * count;
              }, 0);
              setAutoPerSecond(computedAuto);
              loadedAutoPerSecond = computedAuto;
            }
            if (parsed.emojiInventory && typeof parsed.emojiInventory === 'object') {
              setEmojiInventory(parsed.emojiInventory);
            }
            if (Array.isArray(parsed.placements)) {
              setPlacements(
                parsed.placements.map((entry) => ({
                  ...entry,
                  rotation: typeof entry.rotation === 'number' ? entry.rotation : 0,
                }))
              );
            }
            if (Array.isArray(parsed.orbitingUpgradeEmojis)) {
              setOrbitingUpgradeEmojis(parsed.orbitingUpgradeEmojis);
            }
            if (parsed.customEmojiCatalog && typeof parsed.customEmojiCatalog === 'object') {
              setCustomEmojiCatalog(parsed.customEmojiCatalog);
            }
          } catch {
            // ignore malformed stored data
          }
        }

        if (exitEntry[1]) {
          setResumeNotice({
            type: 'returning',
            lifetimeHarvest: loadedLifetimeHarvest ?? lifetimeHarvestRef.current,
            timestamp: Date.now(),
            harvestSnapshot: loadedHarvest ?? harvestRef.current,
            lifetimeHarvestSnapshot: loadedLifetimeHarvest ?? lifetimeHarvestRef.current,
            autoPerSecondSnapshot: loadedAutoPerSecond || autoPerSecondRef.current,
          });
          AsyncStorage.removeItem(LAST_EXIT_STORAGE_KEY).catch(() => {
            // persistence best effort only
          });
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

  useEffect(() => {
    if (!initialisedRef.current) {
      return;
    }

    const payload: StoredGameState = {
      harvest,
      lifetimeHarvest,
      purchasedUpgrades,
      emojiInventory,
      placements,
      orbitingUpgradeEmojis,
      customEmojiCatalog,
    };

    AsyncStorage.setItem(GAME_STORAGE_KEY, JSON.stringify(payload)).catch(() => {
      // persistence best effort only
    });
  }, [customEmojiCatalog, emojiInventory, harvest, lifetimeHarvest, orbitingUpgradeEmojis, placements, purchasedUpgrades]);

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

export const useGame = () => {
  const context = useContext(GameContext);

  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }

  return context;
};
