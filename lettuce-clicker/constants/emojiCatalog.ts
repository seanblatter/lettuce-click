import type { EmojiCategory, EmojiDefinition } from '@/context/GameContext';

const CATEGORY_COST_MULTIPLIER: Record<EmojiCategory, number> = {
  plants: 1.35,
  scenery: 1.45,
  creatures: 1.95,
  features: 2.05,
  accents: 1.4,
};

const COST_ROUNDING_INCREMENT = 5;

const clampCost = (value: number) => {
  if (!Number.isFinite(value)) {
    return 1000;
  }

  const rounded = Math.round(value);
  return Math.max(1000, Math.min(100000, rounded));
};

const hashString = (value: string) => {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    const charCode = value.charCodeAt(index);
    hash = (hash << 5) - hash + charCode;
    hash |= 0;
  }

  return hash >>> 0;
};

const mulberry32 = (seed: number) => {
  let state = seed >>> 0;

  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const generateGaussianSample = (random: () => number) => {
  let u = 0;
  let v = 0;

  while (u === 0) {
    u = random();
  }

  while (v === 0) {
    v = random();
  }

  const magnitude = Math.sqrt(-2.0 * Math.log(u));
  const angle = 2.0 * Math.PI * v;
  return magnitude * Math.cos(angle);
};

const generateGaussianCost = (id: string, fallback: number) => {
  const seed = hashString(id) || hashString(`${id}-fallback`);
  const random = mulberry32(seed);
  const gaussian = generateGaussianSample(random);
  const mean = 42000;
  const standardDeviation = 18000;
  const estimate = mean + gaussian * standardDeviation;

  if (!Number.isFinite(estimate)) {
    return clampCost(fallback || mean);
  }

  return clampCost(estimate);
};

const adjustCostForCategory = (cost: number, category: EmojiCategory) => {
  const multiplier = CATEGORY_COST_MULTIPLIER[category] ?? 1.4;
  const adjusted = cost * multiplier;
  const rounded = Math.ceil(adjusted / COST_ROUNDING_INCREMENT) * COST_ROUNDING_INCREMENT;
  return clampCost(rounded);
};

const createEmoji = (
  definition: Omit<EmojiDefinition, 'tags' | 'popularity'> & {
    tags: (string | { keyword: string; aliases?: string[] })[];
    popularity: number;
  }
): EmojiDefinition => {
  const normalizedTags = definition.tags.flatMap((entry) => {
    if (typeof entry === 'string') {
      return entry;
    }

    const { keyword, aliases = [] } = entry;
    return [keyword, ...aliases];
  });

  return {
    id: definition.id,
    emoji: definition.emoji,
    name: definition.name,
    cost: adjustCostForCategory(
      generateGaussianCost(definition.id, definition.cost),
      definition.category
    ),
    category: definition.category,
    tags: Array.from(new Set(normalizedTags)),
    popularity: definition.popularity,
  };
};

const gardenEmojiEntries: EmojiDefinition[] = [
  createEmoji({
    id: 'sunflower-bloom',
    emoji: '🌻',
    name: 'Sunflower Bloom',
    cost: 75,
    category: 'plants',
    popularity: 1,
    tags: [
      { keyword: 'sunflower', aliases: ['sunny bloom', 'helios flower', 'yellow flower'] },
      'flower',
      'bright',
      'summer',
      'garden classic',
    ],
  }),
  createEmoji({
    id: 'potted-sprout',
    emoji: '🪴',
    name: 'Potted Sprout',
    cost: 65,
    category: 'plants',
    popularity: 2,
    tags: ['sprout', 'potted plant', 'seedling', 'houseplant', 'clay pot'],
  }),
  createEmoji({
    id: 'hanging-ivy',
    emoji: '🌿',
    name: 'Hanging Ivy',
    cost: 60,
    category: 'plants',
    popularity: 3,
    tags: ['ivy', 'vines', 'greenery', 'trailing plant', 'foliage'],
  }),
  createEmoji({
    id: 'tulip-row',
    emoji: '🌷',
    name: 'Tulip Row',
    cost: 55,
    category: 'plants',
    popularity: 4,
    tags: ['tulip', 'spring flower', 'pink flower', 'garden bed'],
  }),
  createEmoji({
    id: 'wild-mushroom',
    emoji: '🍄',
    name: 'Wild Mushroom',
    cost: 70,
    category: 'plants',
    popularity: 5,
    tags: ['mushroom', 'toadstool', 'forest floor', 'fungi', 'whimsy'],
  }),
  createEmoji({
    id: 'fruit-grove',
    emoji: '🍎',
    name: 'Fruit Grove',
    cost: 68,
    category: 'plants',
    popularity: 6,
    tags: ['apple tree', 'orchard', 'fruit', 'autumn harvest'],
  }),
  createEmoji({
    id: 'desert-cactus',
    emoji: '🌵',
    name: 'Desert Cactus',
    cost: 72,
    category: 'plants',
    popularity: 7,
    tags: ['cactus', 'succulent', 'desert', 'arid garden', 'spines'],
  }),
  createEmoji({
    id: 'evergreen-pine',
    emoji: '🌲',
    name: 'Evergreen Pine',
    cost: 82,
    category: 'plants',
    popularity: 8,
    tags: ['pine', 'evergreen', 'forest tree', 'winter', 'woodland'],
  }),
  createEmoji({
    id: 'golden-sunrise',
    emoji: '🌅',
    name: 'Golden Sunrise',
    cost: 112,
    category: 'scenery',
    popularity: 9,
    tags: ['sunrise', 'morning sky', 'sunrise horizon', 'warm light'],
  }),
  createEmoji({
    id: 'midday-sun',
    emoji: '🌞',
    name: 'Midday Sun',
    cost: 124,
    category: 'scenery',
    popularity: 10,
    tags: ['sun', 'sunlight', 'bright sky', 'daytime', 'solar'],
  }),
  createEmoji({
    id: 'rainbow-arc',
    emoji: '🌈',
    name: 'Rainbow Arc',
    cost: 135,
    category: 'scenery',
    popularity: 11,
    tags: ['rainbow', 'colorful sky', 'after rain', 'magic light'],
  }),
  createEmoji({
    id: 'soft-clouds',
    emoji: '🌤️',
    name: 'Soft Clouds',
    cost: 104,
    category: 'scenery',
    popularity: 12,
    tags: ['clouds', 'partly sunny', 'breeze', 'gentle weather'],
  }),
  createEmoji({
    id: 'twilight-moon',
    emoji: '🌙',
    name: 'Twilight Moon',
    cost: 130,
    category: 'scenery',
    popularity: 13,
    tags: ['moon', 'night sky', 'evening', 'calm', 'glow'],
  }),
  createEmoji({
    id: 'shooting-star-trail',
    emoji: '🌠',
    name: 'Shooting Star Trail',
    cost: 142,
    category: 'scenery',
    popularity: 14,
    tags: ['shooting star', 'wish', 'night sparkle', 'meteor'],
  }),
  createEmoji({
    id: 'spring-rain',
    emoji: '🌧️',
    name: 'Spring Rain',
    cost: 110,
    category: 'scenery',
    popularity: 15,
    tags: ['rain', 'shower', 'storm', 'water', 'refresh'],
  }),
  createEmoji({
    id: 'garden-firefly',
    emoji: '🪄',
    name: 'Garden Firefly Glow',
    cost: 108,
    category: 'accents',
    popularity: 16,
    tags: ['firefly', 'sparkle', 'wand light', 'magic glow', 'tiny lights'],
  }),
  createEmoji({
    id: 'honeybee-buzz',
    emoji: '🐝',
    name: 'Honeybee Buzz',
    cost: 78,
    category: 'creatures',
    popularity: 17,
    tags: ['bee', 'pollinator', 'buzz', 'striped insect', 'honey'],
  }),
  createEmoji({
    id: 'monarch-butterfly',
    emoji: '🦋',
    name: 'Monarch Butterfly',
    cost: 82,
    category: 'creatures',
    popularity: 18,
    tags: ['butterfly', 'wings', 'flutter', 'orange butterfly', 'pollinator'],
  }),
  createEmoji({
    id: 'ladybug-luck',
    emoji: '🐞',
    name: 'Ladybug Luck',
    cost: 76,
    category: 'creatures',
    popularity: 19,
    tags: ['ladybug', 'ladybird', 'spots', 'garden insect'],
  }),
  createEmoji({
    id: 'songbird-perch',
    emoji: '🐦',
    name: 'Songbird Perch',
    cost: 84,
    category: 'creatures',
    popularity: 20,
    tags: ['bird', 'songbird', 'perched bird', 'tweet'],
  }),
  createEmoji({
    id: 'field-bunny',
    emoji: '🐇',
    name: 'Field Bunny',
    cost: 88,
    category: 'creatures',
    popularity: 21,
    tags: ['bunny', 'rabbit', 'hare', 'spring critter'],
  }),
  createEmoji({
    id: 'garden-tortoise',
    emoji: '🐢',
    name: 'Garden Tortoise',
    cost: 86,
    category: 'creatures',
    popularity: 22,
    tags: ['turtle', 'tortoise', 'slow friend', 'shell'],
  }),
  createEmoji({
    id: 'curious-cat',
    emoji: '🐈',
    name: 'Curious Garden Cat',
    cost: 94,
    category: 'creatures',
    popularity: 23,
    tags: ['cat', 'kitty', 'pet', 'feline', 'garden companion'],
  }),
  createEmoji({
    id: 'cozy-picnic',
    emoji: '🧺',
    name: 'Cozy Picnic Basket',
    cost: 98,
    category: 'features',
    popularity: 24,
    tags: ['picnic', 'basket', 'blanket', 'snacks', 'outing'],
  }),
  createEmoji({
    id: 'garden-lantern',
    emoji: '🏮',
    name: 'Garden Lantern',
    cost: 96,
    category: 'features',
    popularity: 25,
    tags: ['lantern', 'hanging light', 'glow', 'evening lighting'],
  }),
  createEmoji({
    id: 'stone-path',
    emoji: '🪨',
    name: 'Stone Pathway',
    cost: 90,
    category: 'features',
    popularity: 26,
    tags: ['stone', 'path', 'rock garden', 'walkway'],
  }),
  createEmoji({
    id: 'garden-fountain',
    emoji: '⛲',
    name: 'Garden Fountain',
    cost: 148,
    category: 'features',
    popularity: 27,
    tags: ['fountain', 'water feature', 'splash', 'centerpiece'],
  }),
  createEmoji({
    id: 'greenhouse-nook',
    emoji: '🏡',
    name: 'Greenhouse Nook',
    cost: 185,
    category: 'features',
    popularity: 28,
    tags: ['greenhouse', 'garden home', 'glass house', 'cozy corner'],
  }),
  createEmoji({
    id: 'wooden-bench',
    emoji: '🪑',
    name: 'Wooden Garden Bench',
    cost: 132,
    category: 'features',
    popularity: 29,
    tags: ['bench', 'seat', 'rest spot', 'gather'],
  }),
  createEmoji({
    id: 'herbal-bouquet',
    emoji: '💐',
    name: 'Herbal Bouquet',
    cost: 102,
    category: 'accents',
    popularity: 30,
    tags: ['bouquet', 'flowers', 'arrangement', 'celebration'],
  }),
  createEmoji({
    id: 'glittering-lights',
    emoji: '✨',
    name: 'Glittering Lights',
    cost: 114,
    category: 'accents',
    popularity: 31,
    tags: ['sparkle', 'twinkle', 'stars', 'fairy lights'],
  }),
  createEmoji({
    id: 'garden-heart',
    emoji: '💚',
    name: 'Garden Heart Glow',
    cost: 110,
    category: 'accents',
    popularity: 32,
    tags: ['heart', 'green heart', 'love', 'care'],
  }),
  createEmoji({
    id: 'campfire-cozy',
    emoji: '🔥',
    name: 'Campfire Cozy',
    cost: 152,
    category: 'features',
    popularity: 33,
    tags: ['fire', 'campfire', 'warmth', 'gather'],
  }),
  createEmoji({
    id: 'dawn-dew',
    emoji: '💧',
    name: 'Dawn Dew Drop',
    cost: 99,
    category: 'accents',
    popularity: 34,
    tags: ['water drop', 'dew', 'refreshing', 'morning'],
  }),
  createEmoji({
    id: 'garden-rainbow-flower',
    emoji: '🌼',
    name: 'Garden Daisy',
    cost: 90,
    category: 'plants',
    popularity: 35,
    tags: ['daisy', 'wildflower', 'yellow bloom', 'sunny'],
  }),
  createEmoji({
    id: 'wind-swirls',
    emoji: '💨',
    name: 'Whistling Wind Swirls',
    cost: 104,
    category: 'accents',
    popularity: 36,
    tags: ['wind', 'gust', 'breeze', 'movement'],
  }),
  createEmoji({
    id: 'glowing-star',
    emoji: '🌟',
    name: 'Glowing Star',
    cost: 128,
    category: 'accents',
    popularity: 37,
    tags: ['star', 'shine', 'highlight', 'night sparkle'],
  }),
  createEmoji({
    id: 'tiny-sprouts',
    emoji: '🌱',
    name: 'Tiny Sprouts',
    cost: 82,
    category: 'plants',
    popularity: 38,
    tags: ['sprout', 'seedling', 'new growth', 'fresh'],
  }),
  createEmoji({
    id: 'lily-pad-pond',
    emoji: '🪷',
    name: 'Lily Pad Pond',
    cost: 150,
    category: 'features',
    popularity: 39,
    tags: ['lotus', 'pond', 'water garden', 'tranquil'],
  }),
];

export const gardenEmojiCatalog = gardenEmojiEntries;

export const emojiCategoryOrder: Record<EmojiCategory, number> = {
  plants: 0,
  scenery: 1,
  creatures: 2,
  features: 3,
  accents: 4,
};

