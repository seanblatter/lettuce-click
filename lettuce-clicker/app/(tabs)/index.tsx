import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { OrbitingUpgradeEmojis } from '@/components/OrbitingUpgradeEmojis';
import { useGame } from '@/context/GameContext';
import type { HomeEmojiTheme } from '@/context/GameContext';

const MODAL_STORAGE_KEY = 'lettuce-click:grow-your-park-dismissed';

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
  } = useGame();
  const [showGrowModal, setShowGrowModal] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeNotice, setActiveNotice] = useState<typeof resumeNotice>(null);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const headerPaddingTop = useMemo(() => insets.top + 6, [insets.top]);
  const friendlyName = useMemo(() => {
    const trimmed = profileName.trim();
    return trimmed.length > 0 ? trimmed : 'Gardener';
  }, [profileName]);
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
      return `Your lifetime harvest has been ${activeNotice.lifetimeHarvest.toLocaleString()}. Tap to keep cultivating at ${autoPerSecond.toLocaleString()} auto clicks each second.`;
    }

    return `You have harvested ${activeNotice.passiveHarvest.toLocaleString()} since you last tended to the Garden! Your stores now hold ${harvest.toLocaleString()} harvest with lifetime totals at ${lifetimeHarvest.toLocaleString()}. Auto clicks continue humming at ${autoPerSecond.toLocaleString()} per second.`;
  }, [activeNotice, autoPerSecond, harvest, lifetimeHarvest]);

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

  const handleDismissNotice = useCallback(() => {
    setActiveNotice(null);
    clearResumeNotice();
  }, [clearResumeNotice]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={[styles.headerWrapper, { paddingTop: headerPaddingTop }]}>
          <View style={styles.headerShelf}>
            <Text style={styles.headerText}>🥬 Lettuce Park Gardens</Text>
            <Pressable
              accessibilityLabel={menuOpen ? 'Close garden menu' : 'Open garden menu'}
              accessibilityHint={menuOpen ? undefined : 'Opens actions and emoji theme options'}
              style={styles.menuButton}
              onPress={() => setMenuOpen((prev) => !prev)}
              hitSlop={8}>
              <Text style={[styles.menuIcon, menuOpen && styles.menuIconActive]}>{menuOpen ? '✕' : '☰'}</Text>
            </Pressable>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, { paddingTop: 24 }]}
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
              style={({ pressed }) => [styles.lettuceButton, pressed && styles.lettucePressed]}
            >
              <View style={[styles.ring, styles.ringOuter]} />
              <View style={[styles.ring, styles.ringMiddle]} />
              <View style={[styles.ring, styles.ringInner]} />
              <Text style={styles.lettuceEmoji}>🥬</Text>
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
          animationType="fade"
          transparent
          onRequestClose={() => setMenuOpen(false)}
        >
          <View style={styles.menuModalOverlay}>
            <Pressable style={styles.menuBackdrop} onPress={() => setMenuOpen(false)} />
            <View style={styles.menuModalCard}>
              <View style={styles.menuModalContent}>
                <Pressable style={styles.menuItem} onPress={handleNavigateProfile}>
                  <Text style={styles.menuItemText}>Profile</Text>
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
    paddingBottom: 14,
    backgroundColor: '#f2f9f2',
  },
  headerShelf: {
    backgroundColor: '#1f6f4a',
    borderRadius: 28,
    paddingHorizontal: 18,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    paddingBottom: 140,
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
    backgroundColor: '#f9fff7',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#14532d',
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
    borderColor: 'rgba(56, 161, 105, 0.4)',
  },
  ringMiddle: {
    width: 150,
    height: 150,
    borderColor: 'rgba(72, 187, 120, 0.6)',
  },
  ringInner: {
    width: 108,
    height: 108,
    borderColor: 'rgba(110, 231, 183, 0.8)',
    backgroundColor: 'rgba(209, 250, 229, 0.6)',
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
  menuBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  menuModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 31, 23, 0.58)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  menuModalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    backgroundColor: '#f0fff4',
    shadowColor: '#0f2e20',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
    overflow: 'hidden',
  },
  menuModalContent: {
    paddingVertical: 20,
    paddingHorizontal: 20,
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
