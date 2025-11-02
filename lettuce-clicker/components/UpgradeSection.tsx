import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type {
  EmojiThemeDefinition,
  HomeEmojiTheme,
  UpgradeDefinition,
} from '@/context/GameContext';

type Props = {
  harvest: number;
  autoPerSecond: number;
  upgrades: UpgradeDefinition[];
  purchasedUpgrades: Record<string, number>;
  purchaseUpgrade: (upgradeId: string) => boolean;
  emojiThemes: EmojiThemeDefinition[];
  ownedThemes: Record<HomeEmojiTheme, boolean>;
  purchaseEmojiTheme: (themeId: HomeEmojiTheme) => boolean;
  homeEmojiTheme: HomeEmojiTheme;
  setHomeEmojiTheme: (theme: HomeEmojiTheme) => void;
  title?: string;
};

export function UpgradeSection({
  harvest,
  autoPerSecond,
  upgrades,
  purchasedUpgrades,
  purchaseUpgrade,
  emojiThemes,
  ownedThemes,
  purchaseEmojiTheme,
  homeEmojiTheme,
  setHomeEmojiTheme,
  title = 'Conservatory Upgrades',
}: Props) {
  const ownedUpgradeCount = useMemo(
    () =>
      Object.values(purchasedUpgrades).reduce((total, value) => {
        if (typeof value !== 'number' || !Number.isFinite(value)) {
          return total;
        }
        return total + value;
      }, 0),
    [purchasedUpgrades]
  );

  const sortedThemes = useMemo(
    () =>
      [...emojiThemes].sort((a, b) => {
        if (a.cost === b.cost) {
          return a.name.localeCompare(b.name);
        }
        return a.cost - b.cost;
      }),
    [emojiThemes]
  );

  const [activeWorkshop, setActiveWorkshop] = useState<'automation' | 'themes'>('automation');

  const ownedThemeCount = useMemo(
    () => sortedThemes.filter((theme) => ownedThemes[theme.id]).length,
    [ownedThemes, sortedThemes]
  );

  const lockedThemes = useMemo(
    () => sortedThemes.filter((theme) => !ownedThemes[theme.id]),
    [ownedThemes, sortedThemes]
  );

  const nextThemeCost = lockedThemes.find((theme) => theme.cost > 0)?.cost ?? null;
  const themeToggleHint = lockedThemes.length
    ? nextThemeCost
      ? `Next unlock ${nextThemeCost.toLocaleString()} harvest`
      : 'Free unlock ready'
    : 'Showcase every orbit style you own';
  const activeTheme = useMemo(
    () => sortedThemes.find((theme) => theme.id === homeEmojiTheme) ?? null,
    [homeEmojiTheme, sortedThemes]
  );

  const heroStats = useMemo(
    () => [
      { label: 'Auto clicks /s', value: autoPerSecond.toLocaleString() },
      { label: 'Upgrades owned', value: ownedUpgradeCount.toLocaleString() },
      { label: 'Themes unlocked', value: ownedThemeCount.toLocaleString() },
    ],
    [autoPerSecond, ownedThemeCount, ownedUpgradeCount]
  );

  return (
    <View style={styles.section}>
      <View style={styles.heroCard}>
        <View style={styles.heroBackdrop}>
          <View style={[styles.heroBubble, styles.heroBubbleOne]} />
          <View style={[styles.heroBubble, styles.heroBubbleTwo]} />
          <View style={[styles.heroBubble, styles.heroBubbleThree]} />
        </View>
        <View style={styles.heroContent}>
          <Text style={styles.heroOverline}>Lettuce Park</Text>
          <Text style={styles.heroTitle}>{title}</Text>
          <Text style={styles.heroHarvest}>{harvest.toLocaleString()} harvest of clicks</Text>
          <Text style={styles.heroHint}>
            Invest your harvest to expand automation, and bring fresh ambience to your garden centerpiece.
          </Text>
          <View style={styles.heroStatsRow}>
            {heroStats.map((stat, index) => (
              <View
                key={stat.label}
                style={[styles.heroStat, index > 0 && styles.heroStatWithBorder]}
              >
                <Text
                  style={styles.heroStatLabel}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {stat.label}
                </Text>
                <Text style={styles.heroStatValue}>{stat.value}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.workshopToggleRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: activeWorkshop === 'automation' }}
          accessibilityHint="Show automation upgrades"
          onPress={() => setActiveWorkshop('automation')}
          style={[styles.workshopToggleCard, activeWorkshop === 'automation' && styles.workshopToggleActive]}
        >
          <Text
            style={[styles.workshopToggleEmoji, activeWorkshop === 'automation' && styles.workshopToggleEmojiActive]}
          >
            🤖
          </Text>
          <Text style={[styles.workshopToggleLabel, activeWorkshop === 'automation' && styles.workshopToggleLabelActive]}>
            Automation Workshop
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: activeWorkshop === 'themes' }}
          accessibilityHint={themeToggleHint}
          onPress={() => setActiveWorkshop('themes')}
          style={[styles.workshopToggleCard, activeWorkshop === 'themes' && styles.workshopToggleActive]}
        >
          <Text
            style={[styles.workshopToggleEmoji, activeWorkshop === 'themes' && styles.workshopToggleEmojiActive]}
          >
            🎨
          </Text>
          <Text style={[styles.workshopToggleLabel, activeWorkshop === 'themes' && styles.workshopToggleLabelActive]}>
            Themes Workshop
          </Text>
          {lockedThemes.length ? (
            <View style={[styles.workshopToggleBadge, activeWorkshop === 'themes' && styles.workshopToggleBadgeActive]}>
              <Text style={styles.workshopToggleBadgeText}>{lockedThemes.length} to unlock</Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      <View style={styles.panelContainer}>
        {activeWorkshop === 'automation' ? (
          <View style={styles.workshopPanel}>
            <View style={styles.panelHeaderRow}>
              <Text style={styles.panelTitle}>Automation Workshop</Text>
              <Text style={styles.panelSubtitle}>
                Purchase equipment to boost idle income and attract new orbiting emojis.
              </Text>
            </View>
            <View style={styles.workshopList}>
              {upgrades.map((upgrade) => {
                const owned = purchasedUpgrades[upgrade.id] ?? 0;
                const canAfford = harvest >= upgrade.cost;
                return (
                  <View key={upgrade.id} style={styles.upgradeCard}>
                    <View style={styles.upgradeHeader}>
                      <View style={styles.upgradeTitleGroup}>
                        <Text style={styles.upgradeEmoji}>{upgrade.emoji}</Text>
                        <Text style={styles.upgradeTitle}>{upgrade.name}</Text>
                      </View>
                      <Text style={styles.upgradeCost}>{upgrade.cost.toLocaleString()} harvest</Text>
                    </View>
                    <Text style={styles.upgradeDescription}>{upgrade.description}</Text>
                    <Text style={styles.upgradeBoost}>+{upgrade.increment.toLocaleString()} auto clicks /s</Text>
                    <Text style={styles.upgradeOwned}>Owned: {owned}</Text>
                    <Pressable
                      accessibilityLabel={`Purchase ${upgrade.name}`}
                      disabled={!canAfford}
                      onPress={() => purchaseUpgrade(upgrade.id)}
                      style={[styles.upgradeButton, !canAfford && styles.upgradeButtonDisabled]}
                    >
                      <Text style={styles.upgradeButtonText}>
                        {canAfford ? 'Purchase upgrade' : 'Need more harvest'}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </View>
        ) : (
          <View style={styles.workshopPanel}>
            <View style={styles.panelHeaderRow}>
              <Text style={styles.panelTitle}>Emoji Theme Studio</Text>
              <Text style={styles.panelSubtitle}>
                Unlock premium orbit styles, then apply them instantly to your garden centerpiece.
              </Text>
            </View>
            {activeTheme ? (
              <View style={styles.themeSummaryCard}>
                <View style={styles.themeSummaryBadge}>
                  <Text style={styles.themeSummaryEmoji}>{activeTheme.emoji}</Text>
                </View>
                <View style={styles.themeSummaryBody}>
                  <Text style={styles.themeSummaryTitle}>{activeTheme.name}</Text>
                  <Text style={styles.themeSummaryCopy}>Currently orbiting your lettuce centerpiece.</Text>
                </View>
              </View>
            ) : null}
            <View style={styles.themeList}>
              {sortedThemes.map((theme) => {
                const owned = ownedThemes[theme.id] ?? false;
                const isActive = homeEmojiTheme === theme.id;
                const canAfford = harvest >= theme.cost || theme.cost === 0;
                const statusLabel = isActive ? 'Active' : owned ? 'Owned' : 'Locked';
                const costLabel = theme.cost === 0 ? 'Free starter' : `${theme.cost.toLocaleString()} harvest`;

                return (
                  <View key={theme.id} style={[styles.themeCard, isActive && styles.themeCardActive]}>
                    <View style={styles.themeHeader}>
                      <Text style={styles.themeEmoji}>{theme.emoji}</Text>
                      <View style={styles.themeTitleBlock}>
                        <Text style={styles.themeName}>{theme.name}</Text>
                        <Text style={styles.themeCost}>{costLabel}</Text>
                      </View>
                      <View
                        style={[
                          styles.themeStatusPill,
                          isActive && styles.themeStatusPillActive,
                          owned && !isActive && styles.themeStatusPillOwned,
                        ]}
                      >
                        <Text
                          style={[
                            styles.themeStatusText,
                            isActive && styles.themeStatusTextActive,
                            owned && !isActive && styles.themeStatusTextOwned,
                          ]}
                        >
                          {statusLabel}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.themeDescription}>{theme.description}</Text>
                    <View style={styles.themeActions}>
                      {owned ? (
                        <Pressable
                          accessibilityLabel={`Apply ${theme.name}`}
                          style={[styles.themeApplyButton, isActive && styles.themeApplyButtonDisabled]}
                          onPress={() => setHomeEmojiTheme(theme.id)}
                          disabled={isActive}
                        >
                          <Text style={[styles.themeApplyText, isActive && styles.themeApplyTextDisabled]}>
                            {isActive ? 'In use' : 'Apply theme'}
                          </Text>
                        </Pressable>
                      ) : (
                        <Pressable
                          accessibilityLabel={`Purchase ${theme.name}`}
                          style={[styles.themePurchaseButton, !canAfford && styles.themePurchaseButtonDisabled]}
                          onPress={() => purchaseEmojiTheme(theme.id)}
                          disabled={!canAfford}
                        >
                          <Text style={[styles.themePurchaseText, !canAfford && styles.themePurchaseTextDisabled]}>
                            {canAfford ? 'Purchase theme' : 'Need more harvest'}
                          </Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 24,
  },
  heroCard: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#14532d',
    borderRadius: 26,
    padding: 24,
    shadowColor: '#0b3d2c',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 22,
    elevation: 8,
  },
  heroBackdrop: {
    position: 'absolute',
    inset: 0,
  },
  heroBubble: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.55,
  },
  heroBubbleOne: {
    width: 260,
    height: 260,
    backgroundColor: '#166534',
    top: -40,
    left: -60,
    shadowColor: '#064e3b',
    shadowOpacity: 0.45,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 12 },
  },
  heroBubbleTwo: {
    width: 200,
    height: 200,
    backgroundColor: '#0f766e',
    bottom: -40,
    right: -70,
    shadowColor: '#0f766e',
    shadowOpacity: 0.38,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 14 },
  },
  heroBubbleThree: {
    width: 160,
    height: 160,
    backgroundColor: '#bbf7d0',
    top: 40,
    right: -30,
    shadowColor: '#34d399',
    shadowOpacity: 0.35,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 12 },
  },
  heroContent: {
    gap: 12,
  },
  heroOverline: {
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: '#bbf7d0',
    fontWeight: '700',
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#f0fff4',
  },
  heroHarvest: {
    fontSize: 22,
    fontWeight: '700',
    color: '#dcfce7',
  },
  heroHint: {
    fontSize: 14,
    lineHeight: 20,
    color: '#e6fffa',
  },
  heroStatsRow: {
    marginTop: 4,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(15, 118, 110, 0.35)',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 18,
    columnGap: 18,
    rowGap: 12,
  },
  heroStat: {
    flex: 1,
    minWidth: 110,
    alignItems: 'center',
    gap: 6,
  },
  heroStatWithBorder: {
    borderLeftWidth: 1,
    borderColor: 'rgba(226, 252, 239, 0.5)',
    paddingLeft: 18,
  },
  heroStatLabel: {
    fontSize: 12,
    color: '#bbf7d0',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    textAlign: 'center',
  },
  heroStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f0fff4',
  },
  workshopToggleRow: {
    flexDirection: 'row',
    gap: 16,
  },
  workshopToggleCard: {
    flex: 1,
    borderRadius: 22,
    padding: 18,
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(22, 101, 52, 0.22)',
    shadowColor: '#bbf7d0',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 3,
    gap: 10,
  },
  workshopToggleActive: {
    borderColor: '#14532d',
    borderWidth: 2,
    shadowColor: '#0b3d2c',
    shadowOpacity: 0.3,
    elevation: 4,
  },
  workshopToggleEmoji: {
    fontSize: 32,
  },
  workshopToggleEmojiActive: {
    transform: [{ scale: 1.05 }],
  },
  workshopToggleLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#14532d',
    textAlign: 'center',
  },
  workshopToggleLabelActive: {
    color: '#0f766e',
  },
  workshopToggleBadge: {
    alignSelf: 'center',
    marginTop: 8,
    backgroundColor: '#bbf7d0',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  workshopToggleBadgeActive: {
    backgroundColor: '#86efac',
  },
  workshopToggleBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
  },
  panelContainer: {
    gap: 24,
  },
  workshopPanel: {
    backgroundColor: '#f8fafc',
    borderRadius: 24,
    padding: 22,
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 20,
    elevation: 4,
    gap: 18,
  },
  panelHeaderRow: {
    gap: 8,
  },
  panelTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  panelSubtitle: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  workshopList: {
    gap: 16,
  },
  upgradeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
    shadowColor: '#1f2937',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 10,
  },
  upgradeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  upgradeTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  upgradeTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#14532d',
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  upgradeEmoji: {
    fontSize: 20,
  },
  upgradeCost: {
    fontSize: 15,
    fontWeight: '600',
    color: '#166534',
    maxWidth: '40%',
    textAlign: 'right',
  },
  upgradeDescription: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
  },
  upgradeBoost: {
    fontSize: 13,
    color: '#15803d',
    fontWeight: '600',
  },
  upgradeOwned: {
    fontSize: 13,
    color: '#475569',
  },
  upgradeButton: {
    marginTop: 4,
    backgroundColor: '#14532d',
    paddingVertical: 10,
    borderRadius: 12,
  },
  upgradeButtonDisabled: {
    backgroundColor: '#cbd5e0',
  },
  upgradeButtonText: {
    color: '#f0fff4',
    textAlign: 'center',
    fontWeight: '700',
  },
  themeSummaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ecfeff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  themeSummaryBadge: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#0ea5e9',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0284c7',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
  },
  themeSummaryEmoji: {
    fontSize: 30,
  },
  themeSummaryBody: {
    flex: 1,
    gap: 2,
  },
  themeSummaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  themeSummaryCopy: {
    fontSize: 13,
    color: '#075985',
    lineHeight: 18,
  },
  themeList: {
    gap: 16,
  },
  themeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
    gap: 10,
    shadowColor: '#0f172a',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  themeCardActive: {
    borderWidth: 2,
    borderColor: '#34d399',
  },
  themeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  themeEmoji: {
    fontSize: 30,
  },
  themeTitleBlock: {
    flex: 1,
    gap: 2,
  },
  themeName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
  },
  themeCost: {
    fontSize: 13,
    color: '#64748b',
  },
  themeStatusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#e2e8f0',
  },
  themeStatusPillOwned: {
    backgroundColor: '#bfdbfe',
  },
  themeStatusPillActive: {
    backgroundColor: '#bbf7d0',
  },
  themeStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1f2937',
  },
  themeStatusTextOwned: {
    color: '#1d4ed8',
  },
  themeStatusTextActive: {
    color: '#047857',
  },
  themeDescription: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  themeActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  themePurchaseButton: {
    flex: 1,
    backgroundColor: '#14532d',
    borderRadius: 12,
    paddingVertical: 10,
  },
  themePurchaseButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  themePurchaseText: {
    textAlign: 'center',
    fontWeight: '700',
    color: '#f0fff4',
  },
  themePurchaseTextDisabled: {
    color: '#475569',
  },
  themeApplyButton: {
    flex: 1,
    backgroundColor: '#0ea5e9',
    borderRadius: 12,
    paddingVertical: 10,
  },
  themeApplyButtonDisabled: {
    backgroundColor: '#bae6fd',
  },
  themeApplyText: {
    textAlign: 'center',
    fontWeight: '700',
    color: '#f8fafc',
  },
  themeApplyTextDisabled: {
    color: '#1d4ed8',
  },
});
