import { useMemo, useState } from 'react';
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

export default function MusicScreen() {
  const router = useRouter();
  const [selectedTrackId, setSelectedTrackId] = useState<MusicOption['id']>(MUSIC_OPTIONS[0].id);

  const groupedOptions = useMemo(() => {
    return MUSIC_GROUPS.map((group) => ({
      ...group,
      options: MUSIC_OPTIONS.filter((option) => option.family === group.id),
    }));
  }, []);

  const selectedTrack = useMemo(
    () => MUSIC_OPTIONS.find((option) => option.id === selectedTrackId) ?? MUSIC_OPTIONS[0],
    [selectedTrackId]
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator>
        <Pressable onPress={() => router.back()} style={styles.backButton} accessibilityLabel="Go back">
          <Text style={styles.backLabel}>← Back</Text>
        </Pressable>

        <View style={styles.headerCard}>
          <Text style={styles.headerTitle}>Garden Music</Text>
          <Text style={styles.headerSubtitle}>
            Choose a white or grey music blend to match the mood of your lettuce garden.
          </Text>
        </View>

        {groupedOptions.map((group) => (
          <View key={group.id} style={styles.groupSection}>
            <Text style={styles.groupTitle}>{group.label}</Text>
            <Text style={styles.groupDescription}>{group.intro}</Text>
            <View style={styles.optionGrid}>
              {group.options.map((option) => {
                const isActive = option.id === selectedTrackId;
                return (
                  <Pressable
                    key={option.id}
                    style={[styles.optionCard, isActive && styles.optionCardActive]}
                    onPress={() => setSelectedTrackId(option.id)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isActive }}
                  >
                    <View style={[styles.optionEmojiWrap, isActive && styles.optionEmojiWrapActive]}>
                      <Text style={[styles.optionEmoji, isActive && styles.optionEmojiActive]}>{option.emoji}</Text>
                    </View>
                    <Text style={[styles.optionName, isActive && styles.optionNameActive]}>{option.name}</Text>
                    <Text style={styles.optionDescription}>{option.description}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}

        <View style={styles.selectionCard}>
          <Text style={styles.selectionLabel}>Selected mix</Text>
          <Text style={styles.selectionValue}>
            {selectedTrack.emoji} {selectedTrack.name}
          </Text>
          <Text style={styles.selectionHint}>{selectedTrack.description}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
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
  backButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(22, 101, 52, 0.1)',
  },
  backLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#14532d',
  },
  headerCard: {
    backgroundColor: '#d1fae5',
    borderRadius: 20,
    padding: 20,
    gap: 8,
    shadowColor: '#166534',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#134e32',
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
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  optionCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 14,
    gap: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(20, 83, 45, 0.12)',
    shadowColor: '#0f172a',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  optionCardActive: {
    borderColor: '#10b981',
    shadowColor: '#10b981',
    shadowOpacity: 0.25,
  },
  optionEmojiWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionEmojiWrapActive: {
    backgroundColor: '#bbf7d0',
  },
  optionEmoji: {
    fontSize: 30,
  },
  optionEmojiActive: {
    transform: [{ scale: 1.08 }],
  },
  optionName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#134e32',
    textAlign: 'center',
  },
  optionNameActive: {
    color: '#0f766e',
  },
  optionDescription: {
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
    color: '#1f2937',
  },
  selectionCard: {
    backgroundColor: '#14532d',
    borderRadius: 22,
    padding: 22,
    gap: 6,
    shadowColor: '#0f172a',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },
  selectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#bbf7d0',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  selectionValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#f0fff4',
  },
  selectionHint: {
    fontSize: 13,
    lineHeight: 19,
    color: '#d1fae5',
  },
});
