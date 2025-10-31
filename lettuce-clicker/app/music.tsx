import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

const MUSIC_OPTIONS = [
  {
    id: 'white-hush',
    name: 'White Hush',
    emoji: '🤍',
    description: 'A gentle static wash that brightens focus and energy.',
    family: 'white' as const,
  },
  {
    id: 'white-waves',
    name: 'White Waves',
    emoji: '🌊',
    description: 'Rolling broadband surf that keeps momentum moving.',
    family: 'white' as const,
  },
  {
    id: 'white-sparks',
    name: 'White Sparks',
    emoji: '✨',
    description: 'Shimmering tones that make the garden feel electric.',
    family: 'white' as const,
  },
  {
    id: 'grey-mist',
    name: 'Grey Mist',
    emoji: '🌫️',
    description: 'Balanced whispers of sound for calm concentration.',
    family: 'grey' as const,
  },
  {
    id: 'grey-embers',
    name: 'Grey Embers',
    emoji: '🔥',
    description: 'Warm crackles mixed with low hush for cozy evenings.',
    family: 'grey' as const,
  },
  {
    id: 'grey-lanterns',
    name: 'Grey Lanterns',
    emoji: '🏮',
    description: 'Soft drones and glowing chimes for twilight planting.',
    family: 'grey' as const,
  },
];

const MUSIC_GROUPS = [
  { id: 'white', label: 'White Music', intro: 'Bright, energetic mixes to keep the garden lively.' },
  { id: 'grey', label: 'Grey Music', intro: 'Softly balanced sounds that settle the senses.' },
] as const;

type MusicOption = (typeof MUSIC_OPTIONS)[number];

type MusicContentProps = {
  mode?: 'screen' | 'modal';
  onRequestClose?: () => void;
};

export function MusicContent({ mode = 'screen', onRequestClose }: MusicContentProps) {
  const [selectedTrackId, setSelectedTrackId] = useState<MusicOption['id']>(MUSIC_OPTIONS[0].id);

  const groupedOptions = useMemo(
    () =>
      MUSIC_GROUPS.map((group) => ({
        ...group,
        options: MUSIC_OPTIONS.filter((option) => option.family === group.id),
      })),
    []
  );

  const selectedTrack = useMemo(
    () => MUSIC_OPTIONS.find((option) => option.id === selectedTrackId) ?? MUSIC_OPTIONS[0],
    [selectedTrackId]
  );

  const handleClose = useCallback(() => {
    if (onRequestClose) {
      onRequestClose();
    }
  }, [onRequestClose]);

  const headerBackText = mode === 'screen' ? '← Back' : 'Back';
  const headerBackAccessibility = mode === 'screen' ? 'Go back' : 'Close music lounge';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator
        contentInsetAdjustmentBehavior="never"
      >
        <View style={styles.headerRow}>
          <Pressable
            onPress={handleClose}
            style={styles.headerBackButton}
            accessibilityRole="button"
            accessibilityLabel={headerBackAccessibility}
          >
            <Text style={styles.headerBackText}>{headerBackText}</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Music Lounge</Text>
          <View style={styles.headerButtonPlaceholder} />
        </View>
        <Text style={styles.headerSubtitle}>
          Choose a white or grey music blend to match the mood of your lettuce garden.
        </Text>

        {groupedOptions.map((group) => (
          <View key={group.id} style={styles.groupSection}>
            <Text style={styles.groupTitle}>{group.label}</Text>
            <Text style={styles.groupDescription}>{group.intro}</Text>
            <View style={styles.optionList}>
              {group.options.map((option) => {
                const isActive = option.id === selectedTrackId;
                return (
                  <Pressable
                    key={option.id}
                    style={[styles.optionRow, isActive && styles.optionRowActive]}
                    onPress={() => setSelectedTrackId(option.id)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isActive }}
                  >
                    <View style={[styles.optionEmojiWrap, isActive && styles.optionEmojiWrapActive]}>
                      <Text style={[styles.optionEmoji, isActive && styles.optionEmojiActive]}>{option.emoji}</Text>
                    </View>
                    <View style={styles.optionBody}>
                      <Text style={[styles.optionName, isActive && styles.optionNameActive]}>{option.name}</Text>
                      <Text style={styles.optionDescription}>{option.description}</Text>
                    </View>
                    {isActive ? <Text style={styles.optionBadge}>Active</Text> : null}
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}

        <View style={styles.selectionCard}>
          <Text style={styles.selectionLabel}>Now playing</Text>
          <Text style={styles.selectionValue}>
            {selectedTrack.emoji} {selectedTrack.name}
          </Text>
          <Text style={styles.selectionHint}>{selectedTrack.description}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default function MusicScreen() {
  const router = useRouter();
  return <MusicContent mode="screen" onRequestClose={() => router.back()} />;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f2f9f2',
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    gap: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBackButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(22, 101, 52, 0.14)',
    alignItems: 'center',
    minWidth: 72,
  },
  headerBackText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#14532d',
  },
  headerButtonPlaceholder: {
    width: 72,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#134e32',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: '#166534',
  },
  groupSection: {
    gap: 12,
  },
  groupTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#14532d',
  },
  groupDescription: {
    fontSize: 13,
    color: '#1f2937',
  },
  optionList: {
    gap: 12,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(20, 83, 45, 0.12)',
    shadowColor: '#0f172a',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  optionRowActive: {
    borderColor: '#10b981',
    shadowColor: '#10b981',
    shadowOpacity: 0.22,
  },
  optionEmojiWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionEmojiWrapActive: {
    backgroundColor: '#bbf7d0',
  },
  optionEmoji: {
    fontSize: 28,
  },
  optionEmojiActive: {
    transform: [{ scale: 1.08 }],
  },
  optionBody: {
    flex: 1,
    gap: 2,
  },
  optionName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#134e32',
  },
  optionNameActive: {
    color: '#0f766e',
  },
  optionDescription: {
    fontSize: 13,
    lineHeight: 18,
    color: '#1f2937',
  },
  optionBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#047857',
  },
  selectionCard: {
    backgroundColor: '#f0fdf4',
    borderRadius: 22,
    padding: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    shadowColor: '#0f172a',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  selectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#047857',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  selectionValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#134e32',
  },
  selectionHint: {
    fontSize: 13,
    color: '#1f2937',
    lineHeight: 18,
  },
});
