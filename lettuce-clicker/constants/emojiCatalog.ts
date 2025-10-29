import emojiGroups from 'unicode-emoji-json/data-by-group.json';

import type { EmojiDefinition, EmojiSkinOption } from '@/types/emoji';

type RawEmojiRecord = {
  emoji: string;
  name: string;
  slug?: string;
  skins?: RawEmojiSkin[];
};

type RawEmojiSkin = {
  emoji: string;
  name: string;
  slug?: string;
};

const BASE_COST = 25;
const COST_STEP = 15;
const STEP_SPAN = 6;

const toTitleCase = (value: string) =>
  value
    .split(' ')
    .map((segment) => (segment.length > 0 ? segment[0].toUpperCase() + segment.slice(1) : segment))
    .join(' ');

const normaliseSlug = (slug: string | undefined, fallback: string) => {
  if (slug && slug.trim().length > 0) {
    return slug;
  }
  return fallback;
};

const collectSkins = (baseId: string, skins: RawEmojiSkin[] | undefined): EmojiSkinOption[] | undefined => {
  if (!skins || skins.length === 0) {
    return undefined;
  }

  return skins.map((skin, index) => ({
    id: normaliseSlug(skin.slug, `${baseId}-skin-${index}`),
    emoji: skin.emoji,
    name: toTitleCase(skin.name),
  }));
};

const groupsRecord = emojiGroups as Record<string, RawEmojiRecord[]>;

const derivedCatalog: EmojiDefinition[] = [];

Object.values(groupsRecord).forEach((groupEntries) => {
  groupEntries.forEach((entry) => {
    const baseId = normaliseSlug(entry.slug, `${entry.emoji.codePointAt(0) ?? 0}`);
    const index = derivedCatalog.length;
    const cost = BASE_COST + Math.floor(index / STEP_SPAN) * COST_STEP;

    derivedCatalog.push({
      id: baseId,
      emoji: entry.emoji,
      name: toTitleCase(entry.name),
      cost,
      skins: collectSkins(baseId, entry.skins),
    });
  });
});

export const fullEmojiCatalog: EmojiDefinition[] = derivedCatalog;
