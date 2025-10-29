export type EmojiSkinOption = {
  id: string;
  emoji: string;
  name: string;
};

export type EmojiDefinition = {
  id: string;
  emoji: string;
  name: string;
  cost: number;
  skins?: EmojiSkinOption[];
};
