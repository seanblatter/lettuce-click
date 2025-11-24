import { Platform } from 'react-native';
import emojiKitchenMetadata from './emojiKitchenMetadata.json';

type EmojiKitchenResponse = {
  url?: string;
  imageUrl?: string;
  png?: string;
  result?: { url?: string };
  results?: { url?: string }[];
  description?: string;
};

const normalizeEmoji = (value: string) => value.trim();

export type EmojiKitchenMash = {
  imageUrl: string;
  description: string;
};

// Patch: add type for metadata
interface EmojiKitchenMetadata {
  data: Record<string, {
    combinations: Record<string, Array<{
      gStaticUrl: string;
      alt: string;
    }>>;
  }>;
}

const emojiKitchenMetadataTyped = emojiKitchenMetadata as EmojiKitchenMetadata;

export async function fetchEmojiKitchenMash(baseEmoji: string, blendEmoji: string): Promise<EmojiKitchenMash> {
  const first = normalizeEmoji(baseEmoji);
  const second = normalizeEmoji(blendEmoji);

  if (!first || !second) {
    throw new Error('Choose two emoji to blend.');
  }

  // Convert emoji to codepoints
  function toCodepoint(emoji: string) {
    return Array.from(emoji)
      .map((c) => c.codePointAt(0)?.toString(16))
      .filter(Boolean)
      .join('-');
  }
  const leftCodepoint = toCodepoint(first);
  const rightCodepoint = toCodepoint(second);

  // Try both orders (some combos are only one-way)
  let combo = undefined;
  if (
    emojiKitchenMetadataTyped.data?.[leftCodepoint]?.combinations?.[rightCodepoint]?.length
  ) {
    combo = emojiKitchenMetadataTyped.data[leftCodepoint].combinations[rightCodepoint][0];
  } else if (
    emojiKitchenMetadataTyped.data?.[rightCodepoint]?.combinations?.[leftCodepoint]?.length
  ) {
    combo = emojiKitchenMetadataTyped.data[rightCodepoint].combinations[leftCodepoint][0];
  }

  if (!combo) {
    throw new Error('No Emoji Kitchen mashup for those picks.');
  }

  return {
    imageUrl: combo.gStaticUrl,
    description: combo.alt || `${first} + ${second}`,
  };
}
