import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { fullEmojiCatalog } from '@/constants/emojiCatalog';
import type { EmojiDefinition } from '@/types/emoji';
export type { EmojiDefinition } from '@/types/emoji';

export type HomeEmojiTheme = 'circle' | 'spiral' | 'matrix' | 'clear';

export type UpgradeDefinition = {
  id: string;
  name: string;
  description: string;
  cost: number;
  increment: number;
  emoji: string;
};

export type DrawingPoint = {
  x: number;
  y: number;
};

export type DrawingStroke = {
  id: string;
  color: string;
  width: number;
  points: DrawingPoint[];
};

export type Placement = {
  id: string;
  emojiId: string;
  x: number;
  y: number;
  scale: number;
  variantId?: string | null;
  variantEmoji?: string;
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
  drawings: DrawingStroke[];
  profileName: string;
  profileUsername: string;
  profileImageUri: string | null;
  homeEmojiTheme: HomeEmojiTheme;
  setProfileLifetimeTotal: (value: number) => void;
  addHarvest: () => void;
  purchaseUpgrade: (upgradeId: string) => boolean;
  purchaseEmoji: (emojiId: string) => boolean;
  placeEmoji: (
    emojiId: string,
    position: { x: number; y: number },
    variant?: { id: string | null; emoji: string | null }
  ) => boolean;
  updatePlacement: (placementId: string, updates: Partial<Placement>) => void;
  clearGarden: () => void;
  addDrawingStroke: (stroke: DrawingStroke) => void;
  clearDrawings: () => void;
  setProfileName: (value: string) => void;
  setProfileUsername: (value: string) => void;
  setProfileImageUri: (uri: string | null) => void;
  setHomeEmojiTheme: (theme: HomeEmojiTheme) => void;
  isReady: boolean;
  pendingWelcomeBack: { name: string; lifetime: number } | null;
  pendingPassiveReturn: { name: string; passiveHarvest: number; greeting: string } | null;
  acknowledgeWelcomeBack: () => void;
  acknowledgePassiveReturn: () => void;
};

const PROFILE_STORAGE_KEY = 'lettuce-click:profile';
const THEME_STORAGE_KEY = 'lettuce-click:emoji-theme';
const GAME_STATE_STORAGE_KEY = 'lettuce-click:game-state';
const LAST_ACTIVE_KEY = 'lettuce-click:last-active';

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
  const [drawings, setDrawings] = useState<DrawingStroke[]>([]);
  const [profileName, setProfileName] = useState('');
  const [profileUsername, setProfileUsername] = useState('');
  const [profileImageUri, setProfileImageUri] = useState<string | null>(null);
  const [homeEmojiTheme, setHomeEmojiTheme] = useState<HomeEmojiTheme>('circle');
  const initialisedRef = useRef(false);
  const [isReady, setIsReady] = useState(false);
  const [pendingWelcomeBack, setPendingWelcomeBack] = useState<{
    name: string;
    lifetime: number;
  } | null>(null);
  const [pendingPassiveReturn, setPendingPassiveReturn] = useState<{
    name: string;
    passiveHarvest: number;
    greeting: string;
  } | null>(null);
  const lastBackgroundRef = useRef<number | null>(null);
  const appStateRef = useRef(AppState.currentState);

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
    const emoji = fullEmojiCatalog.find((item) => item.id === emojiId);

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

  const placeEmoji = (
    emojiId: string,
    position: { x: number; y: number },
    variant?: { id: string | null; emoji: string | null }
  ) => {
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
        variantId: variant?.id ?? null,
        variantEmoji: variant?.emoji ?? null,
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
    setDrawings([]);
  };

  const acknowledgeWelcomeBack = () => setPendingWelcomeBack(null);
  const acknowledgePassiveReturn = () => setPendingPassiveReturn(null);

  const addDrawingStroke = (stroke: DrawingStroke) => {
    setDrawings((prev) => [...prev, stroke]);
  };

  const clearDrawings = () => {
    setDrawings([]);
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
    emojiCatalog: fullEmojiCatalog,
    emojiInventory,
    placements,
    drawings,
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
    addDrawingStroke,
    clearDrawings,
    setProfileName,
    setProfileUsername,
    setProfileImageUri,
    setHomeEmojiTheme,
    isReady,
    pendingWelcomeBack,
    pendingPassiveReturn,
    acknowledgeWelcomeBack,
    acknowledgePassiveReturn,
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
    drawings,
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
    addDrawingStroke,
    clearDrawings,
    setProfileName,
    setProfileUsername,
    setProfileImageUri,
    setHomeEmojiTheme,
    isReady,
    pendingWelcomeBack,
    pendingPassiveReturn,
    acknowledgeWelcomeBack,
    acknowledgePassiveReturn,
  ]);

  useEffect(() => {
    if (initialisedRef.current) {
      return;
    }

    AsyncStorage.multiGet([PROFILE_STORAGE_KEY, THEME_STORAGE_KEY, GAME_STATE_STORAGE_KEY, LAST_ACTIVE_KEY])
      .then(([profileEntry, themeEntry, gameEntry, lastActiveEntry]) => {
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

        if (gameEntry[1]) {
          try {
            const parsed = JSON.parse(gameEntry[1]) as {
              harvest?: number;
              lifetimeHarvest?: number;
              autoPerSecond?: number;
              purchasedUpgrades?: Record<string, number>;
              orbitingUpgradeEmojis?: OrbitingEmoji[];
              emojiInventory?: Record<string, number>;
              placements?: Placement[];
              drawings?: DrawingStroke[];
            };

            if (typeof parsed.harvest === 'number') {
              setHarvest(parsed.harvest);
            }
            if (typeof parsed.lifetimeHarvest === 'number') {
              setLifetimeHarvest(parsed.lifetimeHarvest);
            }
            if (typeof parsed.autoPerSecond === 'number') {
              setAutoPerSecond(parsed.autoPerSecond);
            }
            if (parsed.purchasedUpgrades) {
              setPurchasedUpgrades(parsed.purchasedUpgrades);
            }
            if (parsed.orbitingUpgradeEmojis) {
              setOrbitingUpgradeEmojis(parsed.orbitingUpgradeEmojis);
            }
            if (parsed.emojiInventory) {
              setEmojiInventory(parsed.emojiInventory);
            }
            if (parsed.placements) {
              setPlacements(parsed.placements);
            }
            if (parsed.drawings) {
              setDrawings(parsed.drawings);
            }

            setPendingWelcomeBack((prev) =>
              prev ?? {
                name: profileEntry[1]
                  ? (() => {
                      try {
                        const profileParsed = JSON.parse(profileEntry[1]!);
                        return typeof profileParsed.name === 'string' && profileParsed.name.length > 0
                          ? profileParsed.name
                          : 'Gardener';
                      } catch (error) {
                        return 'Gardener';
                      }
                    })()
                  : 'Gardener',
                lifetime: parsed.lifetimeHarvest ?? 0,
              }
            );
          } catch (error) {
            // ignore malformed game state
          }
        }

        if (lastActiveEntry[1]) {
          try {
            const parsedLastActive = JSON.parse(lastActiveEntry[1]) as { timestamp?: number };
            if (parsedLastActive.timestamp) {
              lastBackgroundRef.current = parsedLastActive.timestamp;
            }
          } catch (error) {
            lastBackgroundRef.current = null;
          }
        }
      })
      .finally(() => {
        initialisedRef.current = true;
        setIsReady(true);
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

    const payload = JSON.stringify({
      harvest,
      lifetimeHarvest,
      autoPerSecond,
      purchasedUpgrades,
      orbitingUpgradeEmojis,
      emojiInventory,
      placements,
      drawings,
    });

    AsyncStorage.setItem(GAME_STATE_STORAGE_KEY, payload).catch(() => {
      // persistence best effort only
    });
  }, [
    harvest,
    lifetimeHarvest,
    autoPerSecond,
    purchasedUpgrades,
    orbitingUpgradeEmojis,
    emojiInventory,
    placements,
    drawings,
  ]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      const prevState = appStateRef.current;
      appStateRef.current = nextState;

      if (nextState === 'background' || nextState === 'inactive') {
        const timestamp = Date.now();
        lastBackgroundRef.current = timestamp;
        AsyncStorage.setItem(LAST_ACTIVE_KEY, JSON.stringify({ timestamp })).catch(() => {
          // best effort only
        });
        AsyncStorage.setItem(
          GAME_STATE_STORAGE_KEY,
          JSON.stringify({
            harvest,
            lifetimeHarvest,
            autoPerSecond,
            purchasedUpgrades,
            orbitingUpgradeEmojis,
            emojiInventory,
            placements,
            drawings,
          })
        ).catch(() => {
          // ignore
        });
        return;
      }

      const wasBackground = prevState === 'background' || prevState === 'inactive';
      if (wasBackground && nextState === 'active') {
        const now = Date.now();
        const lastBackground = lastBackgroundRef.current;
        if (lastBackground && now > lastBackground) {
          const elapsedSeconds = Math.floor((now - lastBackground) / 1000);
          if (elapsedSeconds > 0 && autoPerSecond > 0) {
            const passiveHarvest = autoPerSecond * elapsedSeconds;
            setHarvest((prev) => prev + passiveHarvest);
            setLifetimeHarvest((prev) => prev + passiveHarvest);
            setProfileLifetimeTotal((prev) => prev + passiveHarvest);
            setPendingPassiveReturn({
              name: profileName && profileName.length > 0 ? profileName : 'Gardener',
              passiveHarvest,
              greeting: ['Hi', 'Howdy', "What's Up", 'Hello'][Math.floor(Math.random() * 4)],
            });
          }
        }
        lastBackgroundRef.current = null;
        AsyncStorage.removeItem(LAST_ACTIVE_KEY).catch(() => {
          // ignore cleanup error
        });
      }
    });

    return () => subscription.remove();
  }, [
    autoPerSecond,
    harvest,
    lifetimeHarvest,
    purchasedUpgrades,
    orbitingUpgradeEmojis,
    emojiInventory,
    placements,
    drawings,
    profileName,
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
