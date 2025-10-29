declare module 'unicode-emoji-json/data-by-group.json' {
  const value: Record<
    string,
    Array<{
      emoji: string;
      name: string;
      slug?: string;
      skins?: Array<{
        emoji: string;
        name: string;
        slug?: string;
      }>;
    }>
  >;
  export default value;
}
