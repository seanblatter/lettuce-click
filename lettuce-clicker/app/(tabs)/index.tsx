import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { OrbitingUpgradeEmojis } from '@/components/OrbitingUpgradeEmojis';
import { useGame } from '@/context/GameContext';
import type { HomeEmojiTheme } from '@/context/GameContext';

const MODAL_STORAGE_KEY = 'lettuce-click:grow-your-park-dismissed';
const BONUS_REWARD_OPTIONS = [75, 125, 200, 325, 500, 650];
const BONUS_ADDITIONAL_SPINS = 2;

const lightenColor = (hex: string, factor: number) => {
  const normalized = hex.replace('#', '');

  if (normalized.length !== 6 && normalized.length !== 3) {
    return hex;
  }

  const expanded = normalized.length === 3 ? normalized.split('').map((char) => char + char).join('') : normalized;
  const value = Number.parseInt(expanded, 16);

  if (!Number.isFinite(value)) {
    return hex;
  }

  const channel = (shift: number) => (value >> shift) & 0xff;
  const clampChannel = (channelValue: number) => {
    const boundedFactor = Math.min(Math.max(factor, 0), 1);
    const next = Math.round(channelValue + (255 - channelValue) * boundedFactor);
    return Math.max(0, Math.min(255, next));
  };

  const r = clampChannel(channel(16));
  const g = clampChannel(channel(8));
  const b = clampChannel(channel(0));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

export default function HomeScreen() {
  const {
    harvest,
    lifetimeHarvest,
    autoPerSecond,
    addHarvest,
    orbitingUpgradeEmojis,
    homeEmojiTheme,
    setHomeEmojiTheme,
    profileName,
    resumeNotice,
    clearResumeNotice,
    customClickEmoji,
    premiumAccentColor,
    addHarvestAmount,
    spendHarvestAmount,
  } = useGame();
  const [showGrowModal, setShowGrowModal] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeNotice, setActiveNotice] = useState<typeof resumeNotice>(null);
  const [showDailyBonus, setShowDailyBonus] = useState(false);
  const [availableBonusSpins, setAvailableBonusSpins] = useState(1);
  const [bonusMessage, setBonusMessage] = useState<string | null>(null);
  const [lastBonusReward, setLastBonusReward] = useState<number | null>(null);
  const [hasWatchedBonusAd, setHasWatchedBonusAd] = useState(false);
  const [hasPurchasedBonusSpins, setHasPurchasedBonusSpins] = useState(false);
  const [isSpinningBonus, setIsSpinningBonus] = useState(false);
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const headerPaddingTop = useMemo(() => Math.max(insets.top, 4), [insets.top]);
  const contentPaddingBottom = useMemo(() => insets.bottom + 140, [insets.bottom]);
  const friendlyName = useMemo(() => {
    const trimmed = profileName.trim();
    return trimmed.length > 0 ? trimmed : 'Gardener';
  }, [profileName]);
  const accentColor = useMemo(() => premiumAccentColor || '#1f6f4a', [premiumAccentColor]);
  const accentSurface = useMemo(() => lightenColor(accentColor, 0.7), [accentColor]);
  const accentRingOuter = useMemo(() => lightenColor(accentColor, 0.55), [accentColor]);
  const accentRingMiddle = useMemo(() => lightenColor(accentColor, 0.45), [accentColor]);
  const accentRingInner = useMemo(() => lightenColor(accentColor, 0.35), [accentColor]);
  const themeOptions = useMemo(
    () => [
      { label: '🔵 Circle', value: 'circle' as HomeEmojiTheme },
      { label: '🌀 Spiral', value: 'spiral' as HomeEmojiTheme },
      { label: '🟩 Matrix', value: 'matrix' as HomeEmojiTheme },
      { label: '🌫️ Clear', value: 'clear' as HomeEmojiTheme },
    ],
    []
  );
  const noticeTitle = useMemo(() => {
    if (!activeNotice) {
      return '';
    }

    if (activeNotice.type === 'returning') {
      return `Welcome Back ${friendlyName}!`;
    }

    return `${activeNotice.greeting}, ${friendlyName}!`;
  }, [activeNotice, friendlyName]);

  const noticeCopy = useMemo(() => {
    if (!activeNotice) {
      return '';
    }

    if (activeNotice.type === 'returning') {
      return `When you signed back in you had ${activeNotice.harvestSnapshot.toLocaleString()} harvest with lifetime totals at ${activeNotice.lifetimeHarvestSnapshot.toLocaleString()}. Auto clicks continue at ${activeNotice.autoPerSecondSnapshot.toLocaleString()} per second.`;
    }

    return `You gathered ${activeNotice.passiveHarvest.toLocaleString()} harvest while away. Your stores now hold ${activeNotice.harvestSnapshot.toLocaleString()} harvest with lifetime totals at ${activeNotice.lifetimeHarvestSnapshot.toLocaleString()}. Auto clicks continue humming at ${activeNotice.autoPerSecondSnapshot.toLocaleString()} per second.`;
  }, [activeNotice]);

  useEffect(() => {
    AsyncStorage.getItem(MODAL_STORAGE_KEY)
      .then((value) => {
        if (value === 'true') {
          return;
        }
        setShowGrowModal(true);
      })
      .catch(() => {
        setShowGrowModal(true);
      });
  }, []);

  useEffect(() => {
    if (resumeNotice) {
      setActiveNotice(resumeNotice);
    }
  }, [resumeNotice]);

  const handleDismissGrow = useCallback(async () => {
    setShowGrowModal(false);
    try {
      await AsyncStorage.setItem(MODAL_STORAGE_KEY, 'true');
    } catch {
      // Best effort persistence only.
    }
  }, []);

  const handleNavigateProfile = useCallback(() => {
    setMenuOpen(false);
    router.push('/profile');
  }, [router]);

  const handleSelectTheme = useCallback(
    (theme: HomeEmojiTheme) => {
      setHomeEmojiTheme(theme);
      setMenuOpen(false);
    },
    [setHomeEmojiTheme]
  );

  const handleOpenDailyBonus = useCallback(() => {
    setMenuOpen(false);
    setShowDailyBonus(true);
    setAvailableBonusSpins(1);
    setBonusMessage(null);
    setLastBonusReward(null);
    setHasWatchedBonusAd(false);
    setIsSpinningBonus(false);
    setIsWatchingAd(false);
    setHasPurchasedBonusSpins(false);
  }, []);

  const handleCloseDailyBonus = useCallback(() => {
    setShowDailyBonus(false);
  }, []);

  const handleSpinBonus = useCallback(() => {
    if (availableBonusSpins <= 0 || isSpinningBonus) {
      return;
    }

    setIsSpinningBonus(true);
    setBonusMessage('Spinning…');
    const reward = BONUS_REWARD_OPTIONS[Math.floor(Math.random() * BONUS_REWARD_OPTIONS.length)];
    setTimeout(() => {
      addHarvestAmount(reward);
      setAvailableBonusSpins((prev) => Math.max(prev - 1, 0));
      setLastBonusReward(reward);
      setBonusMessage(`You earned ${reward.toLocaleString()} clicks!`);
      setIsSpinningBonus(false);
    }, 900);
  }, [addHarvestAmount, availableBonusSpins, isSpinningBonus]);

  const handleWatchBonusAd = useCallback(() => {
    if (hasWatchedBonusAd || isWatchingAd) {
      Alert.alert('Advertisement already viewed', 'Check back tomorrow for more free spins.');
      return;
    }

    setIsWatchingAd(true);
    setBonusMessage('Watching advertisement…');
    setTimeout(() => {
      setAvailableBonusSpins((prev) => prev + BONUS_ADDITIONAL_SPINS);
      setHasWatchedBonusAd(true);
      setIsWatchingAd(false);
      setBonusMessage('You unlocked two more spins!');
    }, 1200);
  }, [hasWatchedBonusAd, isWatchingAd]);

  const handlePurchaseSpinWithHarvest = useCallback(() => {
    if (isWatchingAd || hasPurchasedBonusSpins) {
      return;
    }

    const cost = 500;
    const success = spendHarvestAmount(cost);
    if (!success) {
      Alert.alert('Not enough harvest', `You need ${cost.toLocaleString()} clicks to purchase extra spins.`);
      return;
    }

    setAvailableBonusSpins((prev) => prev + BONUS_ADDITIONAL_SPINS);
    setHasPurchasedBonusSpins(true);
    setBonusMessage('Purchased two additional spins!');
  }, [hasPurchasedBonusSpins, isWatchingAd, spendHarvestAmount]);

  const handleDismissNotice = useCallback(() => {
    setActiveNotice(null);
    clearResumeNotice();
  }, [clearResumeNotice]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={[styles.headerWrapper, { paddingTop: headerPaddingTop }]}>
          <View style={styles.headerShelf}>
            <Text style={styles.headerText}>Lettuce Park Gardens</Text>
            <Pressable
              accessibilityLabel={menuOpen ? 'Close garden menu' : 'Open garden menu'}
              accessibilityHint={menuOpen ? undefined : 'Opens actions and emoji theme options'}
              style={styles.menuButton}
              onPress={() => setMenuOpen((prev) => !prev)}
              hitSlop={8}>
              <Text style={[styles.menuIcon, menuOpen && styles.menuIconActive]}>
                {menuOpen ? '✕' : customClickEmoji}
              </Text>
            </Pressable>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, { paddingTop: 12, paddingBottom: contentPaddingBottom }]}
          showsVerticalScrollIndicator
          alwaysBounceVertical
        >
          <Text style={styles.title}>Lettuce Click</Text>

          <View style={styles.lettuceWrapper}>
            <View style={styles.lettuceBackdrop}>
              <View style={[styles.backdropBubble, styles.backdropBubbleOne]} />
              <View style={[styles.backdropBubble, styles.backdropBubbleTwo]} />
              <View style={[styles.backdropBubble, styles.backdropBubbleThree]} />
            </View>
            <OrbitingUpgradeEmojis emojis={orbitingUpgradeEmojis} theme={homeEmojiTheme} />
            <Pressable
              accessibilityLabel="Harvest lettuce"
              onPress={addHarvest}
              style={({ pressed }) => [
                styles.lettuceButton,
                { backgroundColor: accentSurface, shadowColor: accentColor },
                pressed && styles.lettucePressed,
              ]}
            >
              <View style={[styles.ring, styles.ringOuter, { borderColor: accentRingOuter }]} />
              <View style={[styles.ring, styles.ringMiddle, { borderColor: accentRingMiddle }]} />
              <View
                style={[
                  styles.ring,
                  styles.ringInner,
                  { borderColor: accentRingInner, backgroundColor: lightenColor(accentRingInner, 0.45) },
                ]}
              />
              <Text style={styles.lettuceEmoji}>{customClickEmoji}</Text>
            </Pressable>
          </View>

          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>Harvest Ledger</Text>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Available harvest</Text>
              <Text style={styles.statValue}>{harvest.toLocaleString()}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Lifetime harvest</Text>
              <Text style={styles.statValue}>{lifetimeHarvest.toLocaleString()}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Auto clicks /s</Text>
              <Text style={styles.statValue}>{autoPerSecond.toLocaleString()}</Text>
            </View>
          </View>
        </ScrollView>

        <Modal
          visible={menuOpen}
          animationType="slide"
          transparent
          onRequestClose={() => setMenuOpen(false)}
        >
          <View style={styles.menuSheetOverlay}>
            <Pressable style={styles.menuSheetBackdrop} onPress={() => setMenuOpen(false)} />
            <View style={styles.menuSheetCard}>
              <View style={styles.menuSheetHandle} />
              <Text style={styles.menuSheetTitle}>Garden menu</Text>
              <Text style={styles.menuSheetSubtitle}>
                Update your profile or refresh your home’s emoji theme.
              </Text>
              <View style={styles.menuSheetContent}>
                <Pressable style={styles.menuItem} onPress={handleNavigateProfile}>
                  <Text style={styles.menuItemText}>Profile</Text>
                </Pressable>
                <Pressable style={styles.menuItem} onPress={handleOpenDailyBonus}>
                  <Text style={[styles.menuItemText, styles.menuHighlight]}>Daily Bonus!</Text>
                </Pressable>
                <View style={styles.menuDivider} />
                <Text style={styles.menuSectionTitle}>Emoji Themes</Text>
                {themeOptions.map((option) => {
                  const isActive = homeEmojiTheme === option.value;
                  return (
                    <Pressable
                      key={option.value}
                      onPress={() => handleSelectTheme(option.value)}
                      style={[styles.themeOption, isActive && styles.themeOptionActive]}>
                      <Text style={[styles.themeOptionText, isActive && styles.themeOptionTextActive]}>{option.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
              <Pressable
                style={styles.menuSheetCloseButton}
                onPress={() => setMenuOpen(false)}
                accessibilityLabel="Close menu">
                <Text style={styles.menuSheetCloseText}>Done</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </View>

      <Modal
        visible={showGrowModal}
        animationType="fade"
        transparent
        onRequestClose={handleDismissGrow}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Grow your park</Text>
            <Text style={styles.modalCopy}>
              Spend harvest on upgrades to unlock faster auto clicks and stronger tap values. Visit the
              Upgrades tab to power up, then bring your harvest to the Garden tab to decorate your
              dream park.
            </Text>
            <Pressable accessibilityLabel="Close grow your park message" style={styles.modalButton} onPress={handleDismissGrow}>
              <Text style={styles.modalButtonText}>Start growing</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        visible={Boolean(activeNotice)}
        animationType="fade"
        transparent
        onRequestClose={handleDismissNotice}
      >
        <View style={styles.noticeOverlay}>
          <View style={styles.noticeCard}>
            <Text style={styles.noticeTitle}>{noticeTitle}</Text>
            <Text style={styles.noticeCopy}>{noticeCopy}</Text>
            <Pressable style={styles.noticeButton} onPress={handleDismissNotice}>
              <Text style={styles.noticeButtonText}>Back to the garden</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={showDailyBonus} animationType="slide" onRequestClose={handleCloseDailyBonus}>
        <SafeAreaView style={styles.bonusSafeArea}>
          <View style={styles.bonusContainer}>
            <Text style={styles.bonusTitle}>Daily Bonus</Text>
            <Text style={styles.bonusSubtitle}>
              Spin the garden wheel for surprise clicks. Your first spin is free every time you open the bonus.
            </Text>
            <View style={[styles.bonusWheel, { borderColor: accentColor }]}>
              <Text style={styles.bonusWheelEmoji}>{customClickEmoji}</Text>
            </View>
            <Text style={styles.bonusSpinsLabel}>
              {availableBonusSpins} {availableBonusSpins === 1 ? 'spin left' : 'spins left'}
            </Text>
            {lastBonusReward ? (
              <Text style={styles.bonusReward}>Last reward: {lastBonusReward.toLocaleString()} clicks</Text>
            ) : null}
            {bonusMessage ? <Text style={styles.bonusMessage}>{bonusMessage}</Text> : null}
            <Pressable
              style={[styles.bonusPrimaryButton, (isSpinningBonus || availableBonusSpins <= 0) && styles.bonusButtonDisabled]}
              onPress={handleSpinBonus}
              disabled={isSpinningBonus || availableBonusSpins <= 0}
              accessibilityLabel="Spin the bonus wheel"
            >
              <Text style={styles.bonusPrimaryText}>
                {availableBonusSpins > 0 ? (isSpinningBonus ? 'Spinning…' : 'Spin for clicks') : 'No spins left'}
              </Text>
            </Pressable>
            <View style={styles.bonusActionsRow}>
              <Pressable
                style={[styles.bonusSecondaryButton, isWatchingAd && styles.bonusButtonDisabled]}
                onPress={handleWatchBonusAd}
                disabled={isWatchingAd}
                accessibilityLabel="Watch an advertisement for spins"
              >
                <Text style={styles.bonusSecondaryText}>
                  {isWatchingAd ? 'Loading…' : hasWatchedBonusAd ? 'Ad watched' : 'Watch ad for 2 spins'}
                </Text>
              </Pressable>
              <Pressable
                style={[styles.bonusSecondaryButton, hasPurchasedBonusSpins && styles.bonusButtonDisabled]}
                onPress={handlePurchaseSpinWithHarvest}
                disabled={hasPurchasedBonusSpins}
                accessibilityLabel="Buy extra spins"
              >
                <Text style={styles.bonusSecondaryText}>
                  {hasPurchasedBonusSpins ? 'Spins purchased' : 'Buy 2 spins (500 clicks)'}
                </Text>
              </Pressable>
            </View>
            <Pressable style={styles.bonusCloseButton} onPress={handleCloseDailyBonus} accessibilityLabel="Close daily bonus">
              <Text style={styles.bonusCloseText}>Back to the garden</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f2f9f2',
  },
  container: {
    flex: 1,
    backgroundColor: '#f2f9f2',
  },
  headerWrapper: {
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: '#14532d',
  },
  headerShelf: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 24,
    backgroundColor: '#14532d',
  },
  headerText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f7fbea',
  },
  menuButton: {
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  menuIcon: {
    fontSize: 24,
    color: '#f7fbea',
    fontWeight: '700',
  },
  menuIconActive: {
    color: '#fefce8',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    gap: 28,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#1f6f4a',
    textAlign: 'center',
  },
  lettuceWrapper: {
    alignSelf: 'center',
    width: 240,
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lettuceBackdrop: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backdropBubble: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.6,
    backgroundColor: '#bbf7d0',
  },
  backdropBubbleOne: {
    width: 220,
    height: 220,
    shadowColor: '#34d399',
    shadowOpacity: 0.45,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 10 },
  },
  backdropBubbleTwo: {
    width: 170,
    height: 170,
    backgroundColor: '#c4f1f9',
    shadowColor: '#38bdf8',
    shadowOpacity: 0.35,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 14 },
  },
  backdropBubbleThree: {
    width: 120,
    height: 120,
    backgroundColor: '#fef3c7',
    shadowColor: '#fbbf24',
    shadowOpacity: 0.35,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 18 },
  },
  lettuceButton: {
    width: 200,
    height: 200,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 14 },
    elevation: 12,
  },
  lettucePressed: {
    transform: [{ scale: 0.95 }],
  },
  ring: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 2,
  },
  ringOuter: {
    width: 200,
    height: 200,
  },
  ringMiddle: {
    width: 150,
    height: 150,
  },
  ringInner: {
    width: 108,
    height: 108,
  },
  lettuceEmoji: {
    fontSize: 76,
  },
  statsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 26,
    padding: 22,
    gap: 14,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 4,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#22543d',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statLabel: {
    fontSize: 16,
    color: '#2d3748',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#22543d',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    gap: 16,
    maxWidth: 420,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1f6f4a',
  },
  modalCopy: {
    fontSize: 15,
    color: '#2d3748',
    lineHeight: 22,
  },
  modalButton: {
    marginTop: 8,
    backgroundColor: '#1f6f4a',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#f0fff4',
    fontWeight: '700',
    fontSize: 16,
  },
  menuSheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 31, 23, 0.58)',
  },
  menuSheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  menuSheetCard: {
    backgroundColor: '#f0fff4',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 28,
    gap: 16,
    shadowColor: '#0f2e20',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -2 },
  },
  menuSheetHandle: {
    alignSelf: 'center',
    width: 48,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#bbf7d0',
  },
  menuSheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#134e32',
    textAlign: 'center',
  },
  menuSheetSubtitle: {
    fontSize: 13,
    color: '#2d3748',
    textAlign: 'center',
    lineHeight: 18,
  },
  menuSheetContent: {
    gap: 14,
  },
  menuItem: {
    paddingVertical: 10,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#134e32',
  },
  menuHighlight: {
    color: '#0f766e',
    fontWeight: '700',
  },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#d1fae5',
    marginVertical: 6,
  },
  menuSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#134e32',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  themeOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
  },
  themeOptionActive: {
    backgroundColor: '#1f6f4a',
  },
  themeOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#134e32',
  },
  themeOptionTextActive: {
    color: '#ecfdf3',
  },
  menuSheetCloseButton: {
    marginTop: 12,
    alignSelf: 'center',
    borderRadius: 16,
    paddingHorizontal: 28,
    paddingVertical: 12,
    backgroundColor: '#1f6f4a',
  },
  menuSheetCloseText: {
    color: '#f0fff4',
    fontWeight: '700',
    fontSize: 16,
  },
  bonusSafeArea: {
    flex: 1,
    backgroundColor: '#f2f9f2',
  },
  bonusContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 18,
  },
  bonusTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#14532d',
    textAlign: 'center',
  },
  bonusSubtitle: {
    fontSize: 15,
    color: '#1f2937',
    textAlign: 'center',
    lineHeight: 22,
  },
  bonusWheel: {
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    shadowColor: '#1f2937',
    shadowOpacity: 0.2,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  bonusWheelEmoji: {
    fontSize: 84,
  },
  bonusSpinsLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#14532d',
  },
  bonusReward: {
    fontSize: 16,
    color: '#1f2937',
  },
  bonusMessage: {
    fontSize: 14,
    color: '#0f766e',
    textAlign: 'center',
  },
  bonusPrimaryButton: {
    width: '100%',
    backgroundColor: '#14532d',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  bonusPrimaryText: {
    color: '#f0fff4',
    fontWeight: '700',
    fontSize: 16,
  },
  bonusActionsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  bonusSecondaryButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#0f766e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bonusSecondaryText: {
    color: '#0f766e',
    fontWeight: '600',
    textAlign: 'center',
  },
  bonusButtonDisabled: {
    opacity: 0.6,
  },
  bonusCloseButton: {
    marginTop: 12,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 28,
    backgroundColor: '#1f6f4a',
  },
  bonusCloseText: {
    color: '#f0fff4',
    fontWeight: '700',
    fontSize: 16,
    textAlign: 'center',
  },
  noticeOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  noticeCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    padding: 24,
    gap: 16,
    shadowColor: '#0f2e20',
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  noticeTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1f6f4a',
    textAlign: 'center',
  },
  noticeCopy: {
    fontSize: 15,
    color: '#2d3748',
    lineHeight: 22,
    textAlign: 'center',
  },
  noticeButton: {
    marginTop: 4,
    alignSelf: 'center',
    backgroundColor: '#1f6f4a',
    borderRadius: 18,
    paddingHorizontal: 26,
    paddingVertical: 12,
  },
  noticeButtonText: {
    color: '#f0fff4',
    fontWeight: '700',
    fontSize: 16,
  },
});
