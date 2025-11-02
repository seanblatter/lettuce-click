import type { EmojiCategory, EmojiDefinition } from '@/context/GameContext';

export const MIN_EMOJI_COST = 120;
export const MAX_EMOJI_COST = 250_000;

const GAUSSIAN_MEAN = 0.5;
const GAUSSIAN_STD_DEV = 0.18;

const clampPercent = (value: number) => Math.min(Math.max(value, 0), 1);

const gaussianWeight = (percent: number) => {
  const normalized = (clampPercent(percent) - GAUSSIAN_MEAN) / GAUSSIAN_STD_DEV;
  return Math.exp(-0.5 * normalized * normalized);
};

const MIN_WEIGHT = gaussianWeight(0);
const MAX_WEIGHT = gaussianWeight(GAUSSIAN_MEAN);

export const computeBellCurveCost = (percent: number) => {
  const weight = gaussianWeight(percent);
  const span = MAX_WEIGHT - MIN_WEIGHT;
  const normalized = span === 0 ? 0 : (weight - MIN_WEIGHT) / span;
  const cost = MIN_EMOJI_COST + normalized * (MAX_EMOJI_COST - MIN_EMOJI_COST);
  return Math.round(cost);
};

const PRICE_ANCHORS: Record<string, number> = {};

const createEmoji = (
  definition: Omit<EmojiDefinition, 'tags' | 'popularity' | 'cost'> & {
    tags: (string | { keyword: string; aliases?: string[] })[];
    popularity: number;
    cost?: number;
    priceAnchorPercent?: number;
  }
): EmojiDefinition => {
  const normalizedTags = definition.tags.flatMap((entry) => {
    if (typeof entry === 'string') {
      return entry;
    }

    const { keyword, aliases = [] } = entry;
    return [keyword, ...aliases];
  });

  if (typeof definition.priceAnchorPercent === 'number') {
    PRICE_ANCHORS[definition.id] = clampPercent(definition.priceAnchorPercent);
  }

  return {
    id: definition.id,
    emoji: definition.emoji,
    name: definition.name,
    cost: definition.cost ?? MIN_EMOJI_COST,
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
  createEmoji({
    id: 'lavender-lane',
    emoji: '🪻',
    name: 'Lavender Lane',
    category: 'plants',
    popularity: 40,
    tags: ['lavender', 'purple flowers', 'fragrance', 'calming bloom', 'herbal'],
  }),
  createEmoji({
    id: 'bonsai-retreat',
    emoji: '🎍',
    name: 'Bonsai Retreat',
    category: 'plants',
    popularity: 41,
    tags: ['bonsai', 'mini tree', 'zen garden', 'trimmed branches', 'careful pruning'],
  }),
  createEmoji({
    id: 'autumn-maple-grove',
    emoji: '🍁',
    name: 'Maple Leaf',
    category: 'scenery',
    popularity: 42,
    tags: ['maple', 'fall leaves', 'crimson canopy', 'seasonal color', 'foliage'],
  }),
  createEmoji({
    id: 'morning-mist-drift',
    emoji: '🌫️',
    name: 'Morning Mist Drift',
    category: 'scenery',
    popularity: 43,
    tags: ['mist', 'fog', 'soft haze', 'cool dawn', 'breeze'],
  }),
  createEmoji({
    id: 'gentle-hedgehog',
    emoji: '🦔',
    name: 'Gentle Hedgehog',
    category: 'creatures',
    popularity: 44,
    tags: ['hedgehog', 'garden friend', 'spines', 'nocturnal', 'critter'],
  }),
  createEmoji({
    id: 'midnight-owl-roost',
    emoji: '🦉',
    name: 'Midnight Owl Roost',
    category: 'creatures',
    popularity: 45,
    tags: ['owl', 'night watch', 'wisdom', 'perch', 'stars'],
  }),
  createEmoji({
    id: 'sage-teahouse',
    emoji: '🍵',
    name: 'Sage Teahouse',
    category: 'features',
    popularity: 46,
    tags: ['tea', 'tea house', 'calm retreat', 'warm cup', 'gather'],
  }),
  createEmoji({
    id: 'stone-arch-bridge',
    emoji: '🌉',
    name: 'Stone Arch Bridge',
    category: 'features',
    popularity: 47,
    tags: ['bridge', 'archway', 'garden path', 'walkover', 'water crossing'],
  }),
  createEmoji({
    id: 'twilight-wind-chimes',
    emoji: '🎐',
    name: 'Twilight Wind Chimes',
    category: 'accents',
    popularity: 48,
    tags: ['wind chime', 'gentle sound', 'breeze song', 'evening accent', 'hanging charm'],
  }),
  createEmoji({
    id: 'glimmer-orb-lights',
    emoji: '🔮',
    name: 'Glimmer Orb Lights',
    category: 'accents',
    popularity: 49,
    tags: ['orb', 'mystic glow', 'path lights', 'floating light', 'spark'],
  }),
  createEmoji({
    id: 'pocket-crickets',
    emoji: '🦗',
    name: 'Pocket Crickets',
    category: 'creatures',
    popularity: 50,
    tags: ['cricket', 'evening song', 'chirp', 'nighttime', 'garden sound'],
  }),
  createEmoji({
    id: 'cobblestone-gate',
    emoji: '🚪',
    name: 'Cobblestone Gate',
    category: 'features',
    popularity: 51,
    tags: ['garden gate', 'entryway', 'stonework', 'welcome arch', 'entrance'],
  }),
  createEmoji({
    id: 'evergreen-oak',
    emoji: '🌳',
    name: 'Evergreen Oak',
    category: 'plants',
    popularity: 52,
    tags: ['oak tree', 'canopy shade', 'stately tree', 'garden landmark', 'evergreen'],
  }),
  createEmoji({
    id: 'rose-archway',
    emoji: '🌹',
    name: 'Rose Archway',
    category: 'plants',
    popularity: 53,
    tags: ['rose arch', 'climbing roses', 'garden entrance', 'petals', 'romantic walkway'],
  }),
  createEmoji({
    id: 'sakura-breeze',
    emoji: '🌸',
    name: 'Sakura Breeze',
    category: 'plants',
    popularity: 54,
    tags: ['cherry blossom', 'sakura', 'pink petals', 'spring bloom', 'hanami'],
  }),
  createEmoji({
    id: 'hibiscus-halo',
    emoji: '🌺',
    name: 'Hibiscus Halo',
    category: 'plants',
    popularity: 55,
    tags: ['hibiscus', 'tropical bloom', 'bold petals', 'vibrant flower', 'island garden'],
  }),
  createEmoji({
    id: 'strawberry-patch',
    emoji: '🍓',
    name: 'Strawberry Patch',
    category: 'plants',
    popularity: 56,
    tags: ['strawberry', 'berry patch', 'sweet harvest', 'garden fruit', 'red berries'],
  }),
  createEmoji({
    id: 'melon-vine',
    emoji: '🍈',
    name: 'Melon Vine',
    category: 'plants',
    popularity: 57,
    tags: ['melon', 'creeping vine', 'green melon', 'summer harvest', 'garden fruit'],
  }),
  createEmoji({
    id: 'blueberry-bramble',
    emoji: '🫐',
    name: 'Blueberry Bramble',
    category: 'plants',
    popularity: 58,
    tags: ['blueberry', 'wild berry', 'purple fruit', 'garden bush', 'sweet harvest'],
  }),
  createEmoji({
    id: 'swan-lagoon',
    emoji: '🦢',
    name: 'Swan Lagoon',
    category: 'creatures',
    popularity: 59,
    tags: ['swan', 'calm water', 'graceful bird', 'lagoon', 'pond life'],
  }),
  createEmoji({
    id: 'peacock-parade',
    emoji: '🦚',
    name: 'Peacock Parade',
    category: 'creatures',
    popularity: 60,
    tags: ['peacock', 'feather fan', 'vibrant bird', 'garden parade', 'plumage'],
  }),
  createEmoji({
    id: 'garden-flamingo',
    emoji: '🦩',
    name: 'Garden Flamingo',
    category: 'creatures',
    popularity: 61,
    tags: ['flamingo', 'garden bird', 'pink bird', 'lawn art', 'tropical wader'],
  }),
  createEmoji({
    id: 'foxtail-hollow',
    emoji: '🦊',
    name: 'Foxtail Hollow',
    category: 'creatures',
    popularity: 62,
    tags: ['fox', 'forest friend', 'clever critter', 'bushy tail', 'garden visitor'],
  }),
  createEmoji({
    id: 'river-otter',
    emoji: '🦦',
    name: 'River Otter',
    category: 'creatures',
    popularity: 63,
    tags: ['otter', 'riverbank', 'playful swimmer', 'freshwater friend', 'whiskers'],
  }),
  createEmoji({
    id: 'winged-companion',
    emoji: '🪽',
    name: 'Winged Companion',
    category: 'accents',
    popularity: 64,
    tags: ['wing', 'feather', 'flutter', 'airborne', 'light breeze'],
  }),
  createEmoji({
    id: 'lantern-glow',
    emoji: '🏮',
    name: 'Lantern Glow',
    category: 'accents',
    popularity: 65,
    tags: ['lantern', 'paper lantern', 'warm glow', 'evening light', 'festival'],
  }),
  createEmoji({
    id: 'picnic-basket',
    emoji: '🧺',
    name: 'Picnic Basket',
    category: 'features',
    popularity: 66,
    tags: ['picnic basket', 'woven basket', 'blanket', 'afternoon tea', 'snack time'],
  }),
  createEmoji({
    id: 'watering-pail',
    emoji: '🪣',
    name: 'Watering Pail',
    category: 'features',
    popularity: 67,
    tags: ['watering can', 'garden tool', 'sprinkle', 'metal pail', 'garden care'],
  }),
  createEmoji({
    id: 'mossy-log',
    emoji: '🪵',
    name: 'Mossy Log',
    category: 'features',
    popularity: 68,
    tags: ['mossy log', 'forest floor', 'wooden log', 'soft moss', 'natural seat'],
  }),
  createEmoji({
    id: 'riverstone-stack',
    emoji: '🪨',
    name: 'Riverstone Stack',
    category: 'features',
    popularity: 69,
    tags: ['river stone', 'zen rocks', 'stacked stones', 'garden cairn', 'smooth pebbles'],
  }),
  createEmoji({
    id: 'empty-nest-perch',
    emoji: '🪹',
    name: 'Empty Nest Perch',
    category: 'features',
    popularity: 70,
    tags: ['empty nest', 'twigs', 'perch', 'tree branch', 'quiet rest'],
  }),
  createEmoji({
    id: 'cozy-nest-eggs',
    emoji: '🪺',
    name: 'Cozy Nest Eggs',
    category: 'features',
    popularity: 71,
    tags: ['nest eggs', 'blue eggs', 'twig nest', 'springtime', 'gentle care'],
  }),
  createEmoji({
    id: 'legendary-lettuce',
    emoji: '🥬',
    name: 'Legendary Lettuce',
    category: 'plants',
    popularity: 90,
    priceAnchorPercent: 0.5,
    cost: MAX_EMOJI_COST,
    tags: [
      { keyword: 'lettuce', aliases: ['leafy green', 'garden lettuce', 'salad green'] },
      'signature',
      'garden core',
      'clicker icon',
    ],
  }),
];

const sortedByPopularity = [...gardenEmojiEntries].sort((a, b) => a.popularity - b.popularity);
const totalEntries = sortedByPopularity.length;

const pricedByPopularity = sortedByPopularity.map((entry, index) => {
  const anchorPercent = PRICE_ANCHORS[entry.id];
  const percent =
    typeof anchorPercent === 'number'
      ? anchorPercent
      : totalEntries <= 1
      ? 0.5
      : index / (totalEntries - 1);
  return { ...entry, cost: computeBellCurveCost(percent) };
});

const priceMap = new Map(pricedByPopularity.map((entry) => [entry.id, entry.cost]));

export const gardenEmojiCatalog = gardenEmojiEntries.map((entry) => ({
  ...entry,
  cost: priceMap.get(entry.id) ?? computeBellCurveCost(0.5),
}));

const TRILLION = 1_000_000_000_000;
const BILLION = 1_000_000_000;
const MILLION = 1_000_000;

const trimTrailingZeros = (value: number) => {
  const fixed = value.toFixed(2);
  return fixed.replace(/\.0+$/, '').replace(/(\.[1-9])0$/, '$1');
};

export const formatClickValue = (value: number) => {
  if (value >= TRILLION) {
    return `${trimTrailingZeros(value / TRILLION)}T`;
  }

  if (value >= BILLION) {
    return `${trimTrailingZeros(value / BILLION)}B`;
  }

  if (value >= MILLION) {
    return `${trimTrailingZeros(value / MILLION)}M`;
  }

  if (value >= 1000) {
    return value.toLocaleString();
  }

  return `${Math.round(value)}`;
};

export const emojiCategoryOrder: Record<EmojiCategory, number> = {
  plants: 0,
  scenery: 1,
  creatures: 2,
  features: 3,
  accents: 4,
};

