import { Platform } from 'react-native';

type EmojiKitchenResponse = {
  url?: string;
  imageUrl?: string;
  png?: string;
  result?: { url?: string };
  results?: { url?: string }[];
  description?: string;
};

const API_URL = 'https://emojikitchen.dev/api/v1/merge';

const normalizeEmoji = (value: string) => value.trim();

export type EmojiKitchenMash = {
  imageUrl: string;
  description: string;
};

export async function fetchEmojiKitchenMash(baseEmoji: string, blendEmoji: string): Promise<EmojiKitchenMash> {
  const first = normalizeEmoji(baseEmoji);
  const second = normalizeEmoji(blendEmoji);

  if (!first || !second) {
    throw new Error('Choose two emoji to blend.');
  }

  const params = new URLSearchParams({ emoji1: first, emoji2: second });
  const requestUrl = `${API_URL}?${params.toString()}`;
  const response = await fetch(requestUrl, {
    headers: {
      'User-Agent': `lettuce-click/${Platform.OS}`,
      accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Emoji Kitchen is unavailable right now.');
  }

  const data = (await response.json()) as EmojiKitchenResponse;
  const derivedUrl =
    data?.url ||
    data?.imageUrl ||
    data?.png ||
    data?.result?.url ||
    (Array.isArray(data?.results) ? data.results.find((entry) => Boolean(entry.url))?.url : undefined);

  if (!derivedUrl) {
    throw new Error('Emoji Kitchen did not return a blend for those picks.');
  }

  return {
    imageUrl: derivedUrl,
    description: data?.description || `${first} + ${second}`,
  };
}
