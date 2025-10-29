import { characters, strings } from 'regenerate-unicode-properties/Property_of_Strings/RGI_Emoji.js';

import type { EmojiDefinition } from '@/context/GameContext';

const emojiSet = new Set<string>();

characters.toArray().forEach((code: number) => {
  emojiSet.add(String.fromCodePoint(code));
});

strings.forEach((sequence: string) => {
  emojiSet.add(sequence);
});

const toCodePointLabels = (emoji: string) =>
  Array.from(emoji)
    .map((char) => char.codePointAt(0) ?? 0)
    .map((value) => value.toString(16).toUpperCase().padStart(4, '0'));

const buildCatalog = (): EmojiDefinition[] => {
  const entries: EmojiDefinition[] = [];

  emojiSet.forEach((emoji) => {
    const order = entries.length;
    const rawCodePoints = toCodePointLabels(emoji);
    const displayCodePoints = rawCodePoints.filter((value) => value !== 'FE0F');
    const labelCodePoints = displayCodePoints.length > 0 ? displayCodePoints : rawCodePoints;
    const idSegment = rawCodePoints.join('-').toLowerCase();

    entries.push({
      id: idSegment ? `emoji-${idSegment}` : `emoji-${order}`,
      emoji,
      name:
        labelCodePoints.length > 0
          ? `Emoji ${emoji} (U+${labelCodePoints.join(' U+')})`
          : `Emoji ${emoji}`,
      cost: 25 + order * 5,
    });
  });

  return entries;
};

export const gardenEmojiCatalog = buildCatalog();
