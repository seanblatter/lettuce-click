import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { OrbitingUpgradeEmojis } from '@/components/OrbitingUpgradeEmojis';
import type { HomeEmojiTheme, ThemeDefinition } from '@/context/GameContext';

const PREVIEW_RADIUS = 78;
const PREVIEW_MIN_EMOJIS = 12;
const PREVIEW_MAX_EMOJIS = 28;

type Props = {
  harvest: number;
  homeEmojiTheme: HomeEmojiTheme;
  themes: ThemeDefinition[];
  purchasedThemes: Record<HomeEmojiTheme, boolean>;
  purchaseTheme: (themeId: HomeEmojiTheme) => boolean;
  setHomeEmojiTheme: (theme: HomeEmojiTheme) => void;
};

export function ThemeShopSection({
  harvest,
  homeEmojiTheme,
  themes,
  purchasedThemes,
  purchaseTheme,
  setHomeEmojiTheme,
}: Props) {
  const orderedThemes = useMemo(
    () =>
      themes
        .slice()
        .sort((a, b) => {
          const aStarter = a.isStarter ? 0 : 1;
          const bStarter = b.isStarter ? 0 : 1;
          if (aStarter !== bStarter) {
            return aStarter - bStarter;
          }

          if (a.cost !== b.cost) {
            return a.cost - b.cost;
          }

          return a.name.localeCompare(b.name);
        }),
    [themes]
  );

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Emoji Theme Studio</Text>
        <Text style={styles.sectionSubtitle}>
          Collect new displays to showcase your orbiting emoji companions. Themes unlock unique motions and
          lighting for your garden showcase.
        </Text>
      </View>
      <View style={styles.themeGrid}>
        {orderedThemes.map((theme) => {
          const owned = purchasedThemes[theme.id] ?? false;
          const isActive = homeEmojiTheme === theme.id;
          const canAfford = owned || harvest >= theme.cost;
          const previewEmojis = theme.previewEmojis.length > 0 ? theme.previewEmojis : ['✨'];
          const repetitions = Math.ceil(PREVIEW_MIN_EMOJIS / previewEmojis.length);
          const count = Math.min(
            PREVIEW_MAX_EMOJIS,
            Math.max(PREVIEW_MIN_EMOJIS, previewEmojis.length * repetitions)
          );
          const orbitingPreview = Array.from({ length: count }, (_, index) => ({
            id: `${theme.id}-preview-${index}`,
            emoji: previewEmojis[index % previewEmojis.length],
          }));
          const buttonDisabled = (!owned && !canAfford) || (owned && isActive);
          const buttonLabel = owned
            ? isActive
              ? 'Active theme'
              : 'Use theme'
            : canAfford
            ? `Purchase for ${theme.cost.toLocaleString()}`
            : 'Need more harvest';

          return (
            <View key={theme.id} style={[styles.themeCard, owned && styles.themeCardOwned]}>
              <View style={styles.previewWrapper}>
                <View style={styles.previewBackdrop}>
                  <Text style={styles.previewGlyph}>{theme.emoji}</Text>
                </View>
                <OrbitingUpgradeEmojis emojis={orbitingPreview} radius={PREVIEW_RADIUS} theme={theme.id} />
              </View>
              <Text style={styles.themeName}>{theme.name}</Text>
              <Text style={styles.themeDescription}>{theme.description}</Text>
              <View style={styles.themeMetaRow}>
                <View style={styles.metaPill}>
                  <Text style={styles.metaPillText}>{owned ? 'Owned' : 'New'}</Text>
                </View>
                <Text style={[styles.themeCost, owned && styles.themeCostOwned]}>
                  {owned ? 'Ready to use' : `${theme.cost.toLocaleString()} harvest`}
                </Text>
              </View>
              <Pressable
                accessibilityLabel={`${owned ? 'Select' : 'Purchase'} ${theme.name}`}
                disabled={buttonDisabled}
                onPress={() => {
                  if (owned) {
                    if (!isActive) {
                      setHomeEmojiTheme(theme.id);
                    }
                    return;
                  }
                  purchaseTheme(theme.id);
                }}
                style={[
                  styles.themeButton,
                  buttonDisabled && styles.themeButtonDisabled,
                  owned && styles.themeButtonOwned,
                  isActive && styles.themeButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.themeButtonText,
                    buttonDisabled && styles.themeButtonTextDisabled,
                    isActive && styles.themeButtonTextActive,
                  ]}
                >
                  {buttonLabel}
                </Text>
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 18,
  },
  sectionHeader: {
    backgroundColor: '#1c4532',
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 3,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#e6fffa',
  },
  sectionSubtitle: {
    color: '#c6f6d5',
    fontSize: 14,
    lineHeight: 20,
  },
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-between',
  },
  themeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    width: '48%',
    shadowColor: '#2f855a',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 14,
    elevation: 3,
    gap: 12,
  },
  themeCardOwned: {
    borderWidth: 1,
    borderColor: '#38a169',
  },
  previewWrapper: {
    height: 150,
    borderRadius: 16,
    backgroundColor: '#f0fff4',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewBackdrop: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewGlyph: {
    fontSize: 64,
    opacity: 0.08,
  },
  themeName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a4731',
  },
  themeDescription: {
    fontSize: 13,
    color: '#2d3748',
    lineHeight: 18,
  },
  themeMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaPill: {
    backgroundColor: '#22543d',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  metaPillText: {
    color: '#f0fff4',
    fontSize: 12,
    fontWeight: '600',
  },
  themeCost: {
    fontSize: 12,
    fontWeight: '600',
    color: '#22543d',
  },
  themeCostOwned: {
    color: '#2b6cb0',
  },
  themeButton: {
    backgroundColor: '#22543d',
    paddingVertical: 10,
    borderRadius: 12,
  },
  themeButtonOwned: {
    backgroundColor: '#234e52',
  },
  themeButtonActive: {
    backgroundColor: '#2b6cb0',
  },
  themeButtonDisabled: {
    backgroundColor: '#cbd5e0',
  },
  themeButtonText: {
    color: '#f0fff4',
    textAlign: 'center',
    fontWeight: '700',
  },
  themeButtonTextDisabled: {
    color: '#2d3748',
  },
  themeButtonTextActive: {
    color: '#ebf8ff',
  },
});
