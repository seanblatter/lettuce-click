import { useMemo } from 'react';
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

  return (
    <View style={styles.section}>
      <View style={styles.bannerCard}>
        <Text style={styles.bannerTitle}>{title}</Text>
        <Text style={styles.bannerHarvest}>{harvest.toLocaleString()} harvest on hand</Text>
        <Text style={styles.bannerHint}>
          Invest your harvest to expand automation and unlock fresh emoji atmospheres.
        </Text>
        <View style={styles.bannerStatsRow}>
          <View style={styles.bannerStat}>
            <Text style={styles.bannerStatLabel}>Auto clicks /s</Text>
            <Text style={styles.bannerStatValue}>{autoPerSecond.toLocaleString()}</Text>
          </View>
          <View style={styles.bannerStatDivider} />
          <View style={styles.bannerStat}>
            <Text style={styles.bannerStatLabel}>Upgrades owned</Text>
            <Text style={styles.bannerStatValue}>{ownedUpgradeCount.toLocaleString()}</Text>
          </View>
        </View>
      </View>

      <View style={styles.panelContainer}>
        <View style={styles.upgradePanel}>
          <Text style={styles.panelTitle}>Automation Workshop</Text>
          <Text style={styles.panelSubtitle}>
            Purchase equipment to boost your idle income and attract new orbiting emojis.
          </Text>
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
                  style={[styles.upgradeButton, !canAfford && styles.upgradeButtonDisabled]}>
                  <Text style={styles.upgradeButtonText}>
                    {canAfford ? 'Purchase upgrade' : 'Need more harvest'}
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </View>

        <View style={styles.themePanel}>
          <Text style={styles.panelTitle}>Emoji Theme Studio</Text>
          <Text style={styles.panelSubtitle}>
            Unlock premium orbit styles, then apply them instantly to your garden centerpiece.
          </Text>
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
                    ]}>
                    <Text
                      style={[
                        styles.themeStatusText,
                        isActive && styles.themeStatusTextActive,
                        owned && !isActive && styles.themeStatusTextOwned,
                      ]}>
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
                      disabled={isActive}>
                      <Text
                        style={[styles.themeApplyText, isActive && styles.themeApplyTextDisabled]}>
                        {isActive ? 'In use' : 'Apply theme'}
                      </Text>
                    </Pressable>
                  ) : (
                    <Pressable
                      accessibilityLabel={`Purchase ${theme.name}`}
                      style={[styles.themePurchaseButton, !canAfford && styles.themePurchaseButtonDisabled]}
                      onPress={() => purchaseEmojiTheme(theme.id)}
                      disabled={!canAfford}>
                      <Text
                        style={[styles.themePurchaseText, !canAfford && styles.themePurchaseTextDisabled]}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 24,
  },
  bannerCard: {
    backgroundColor: '#1f6f4a',
    borderRadius: 24,
    paddingVertical: 24,
    paddingHorizontal: 24,
    shadowColor: '#0b3d2c',
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 18,
    elevation: 6,
    gap: 10,
  },
  bannerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#dcfce7',
  },
  bannerHarvest: {
    fontSize: 26,
    fontWeight: '800',
    color: '#bbf7d0',
  },
  bannerHint: {
    fontSize: 14,
    lineHeight: 20,
    color: '#e6fffa',
  },
  bannerStatsRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(19,78,32,0.28)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 16,
  },
  bannerStat: {
    flex: 1,
  },
  bannerStatLabel: {
    fontSize: 13,
    color: '#c6f6d5',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  bannerStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f0fff4',
  },
  bannerStatDivider: {
    width: 1,
    height: '70%',
    backgroundColor: 'rgba(220,252,231,0.35)',
  },
  panelContainer: {
    gap: 24,
  },
  upgradePanel: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 20,
    shadowColor: '#2f855a',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 5,
    gap: 16,
  },
  themePanel: {
    backgroundColor: '#f8fafc',
    borderRadius: 22,
    padding: 20,
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 4,
    gap: 16,
  },
  panelTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  panelSubtitle: {
    fontSize: 14,
    color: '#4a5568',
    lineHeight: 20,
  },
  upgradeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
    shadowColor: '#2f855a',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 3,
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
    color: '#1a4731',
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  upgradeEmoji: {
    fontSize: 20,
  },
  upgradeCost: {
    fontSize: 15,
    fontWeight: '600',
    color: '#276749',
    maxWidth: '40%',
    textAlign: 'right',
  },
  upgradeDescription: {
    fontSize: 14,
    color: '#2d3748',
    lineHeight: 20,
  },
  upgradeBoost: {
    fontSize: 13,
    color: '#2f855a',
    fontWeight: '600',
  },
  upgradeOwned: {
    fontSize: 13,
    color: '#4a5568',
  },
  upgradeButton: {
    marginTop: 4,
    backgroundColor: '#22543d',
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
    color: '#1f2937',
  },
  themeCost: {
    fontSize: 13,
    color: '#4a5568',
  },
  themeStatusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#e5e7eb',
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
    backgroundColor: '#1f6f4a',
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
    backgroundColor: '#bfdbfe',
  },
  themeApplyText: {
    textAlign: 'center',
    fontWeight: '700',
    color: '#f8fafc',
  },
  themeApplyTextDisabled: {
    color: '#1e3a8a',
  },
});
