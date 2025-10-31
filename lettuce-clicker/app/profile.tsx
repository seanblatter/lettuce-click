import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

import { useGame } from '@/context/GameContext';

const PREMIUM_ACCENT_OPTIONS = ['#1f6f4a', '#047857', '#2563eb', '#a855f7', '#f97316', '#0ea5e9'];

export default function ProfileScreen() {
  const {
    profileName,
    profileUsername,
    profileImageUri,
    profileLifetimeTotal,
    setProfileName,
    setProfileUsername,
    setProfileImageUri,
    hasPremiumUpgrade,
    premiumAccentColor,
    customClickEmoji,
    purchasePremiumUpgrade,
    setPremiumAccentColor,
    setCustomClickEmoji,
    emojiCatalog,
    emojiInventory,
    registerCustomEmoji,
  } = useGame();
  const router = useRouter();
  const [name, setName] = useState(profileName);
  const [username, setUsername] = useState(profileUsername);
  const [isSaving, setIsSaving] = useState(false);
  const [emojiInput, setEmojiInput] = useState(customClickEmoji);
  const [accentSelection, setAccentSelection] = useState(premiumAccentColor);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setName(profileName);
  }, [profileName]);

  useEffect(() => {
    setUsername(profileUsername);
  }, [profileUsername]);

  useEffect(() => {
    setEmojiInput(customClickEmoji);
  }, [customClickEmoji]);

  useEffect(() => {
    setAccentSelection(premiumAccentColor);
  }, [premiumAccentColor]);

  const emojiOptions = useMemo(() => {
    const sorted = [...emojiCatalog].sort((a, b) => (emojiInventory[b.id] ?? 0) - (emojiInventory[a.id] ?? 0));
    return sorted.slice(0, 18);
  }, [emojiCatalog, emojiInventory]);

  const persistProfile = useCallback(() => {
    setIsSaving(true);
    setProfileName(name.trim());
    setProfileUsername(username.trim());
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      setIsSaving(false);
      saveTimeoutRef.current = null;
    }, 320);
  }, [name, username, setProfileName, setProfileUsername]);

  useEffect(
    () => () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    },
    []
  );

  const handlePickImage = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Allow photo access to choose a profile image.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (!result.canceled) {
        const asset = result.assets[0];
        setProfileImageUri(asset.uri);
      }
    } catch {
      Alert.alert('Something went wrong', 'Unable to open the photo library right now.');
    }
  }, [setProfileImageUri]);

  const handleRemoveImage = useCallback(() => {
    setProfileImageUri(null);
  }, [setProfileImageUri]);

  const handleUpgrade = useCallback(() => {
    if (hasPremiumUpgrade) {
      return;
    }

    Alert.alert(
      'Upgrade to Garden Plus',
      'Unlock custom emoji and accent colors for your clicker button and menu icon.',
      [
        { text: 'Not now', style: 'cancel' },
        { text: 'Upgrade', onPress: purchasePremiumUpgrade },
      ]
    );
  }, [hasPremiumUpgrade, purchasePremiumUpgrade]);

  const handleSelectAccent = useCallback(
    (color: string) => {
      if (!hasPremiumUpgrade) {
        Alert.alert('Upgrade required', 'Upgrade to choose custom accent colors.');
        return;
      }

      setAccentSelection(color);
      setPremiumAccentColor(color);
    },
    [hasPremiumUpgrade, setPremiumAccentColor]
  );

  const applyEmojiSelection = useCallback(
    (value: string) => {
      if (!hasPremiumUpgrade) {
        Alert.alert('Upgrade required', 'Upgrade to change your click emoji.');
        return;
      }

      const trimmed = value.trim();

      if (trimmed.length === 0) {
        setEmojiInput('');
        return;
      }

      const glyph = Array.from(trimmed)[0];

      if (!glyph) {
        setEmojiInput('');
        return;
      }

      setEmojiInput(glyph);
      setCustomClickEmoji(glyph);
      registerCustomEmoji(glyph);
    },
    [hasPremiumUpgrade, registerCustomEmoji, setCustomClickEmoji]
  );

  const handleEmojiInputChange = useCallback(
    (value: string) => {
      applyEmojiSelection(value);
    },
    [applyEmojiSelection]
  );

  const handleChooseEmoji = useCallback(
    (emoji: string) => {
      if (!hasPremiumUpgrade) {
        Alert.alert('Upgrade required', 'Upgrade to change your click emoji.');
        return;
      }

      applyEmojiSelection(emoji);
    },
    [applyEmojiSelection, hasPremiumUpgrade]
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator>
        <Pressable onPress={() => router.back()} style={styles.backButton} accessibilityLabel="Go back">
          <Text style={styles.backLabel}>← Back</Text>
        </Pressable>

        <View style={styles.headerCard}>
          <Pressable style={styles.avatarButton} onPress={handlePickImage} accessibilityLabel="Choose profile image">
            {profileImageUri ? (
              <Image source={{ uri: profileImageUri }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarPlaceholder}>📸</Text>
            )}
          </Pressable>
          <Text style={styles.headerTitle}>Garden Profile</Text>
          <Text style={styles.headerSubtitle}>Personalize your profile and celebrate your harvest!</Text>
          {profileImageUri && (
            <Pressable onPress={handleRemoveImage} style={styles.removePhotoButton} accessibilityLabel="Remove profile image">
              <Text style={styles.removePhotoText}>Remove photo</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionLabel}>Display name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            style={styles.input}
            returnKeyType="done"
          />
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionLabel}>Username</Text>
          <TextInput
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="@lettuce-lover"
            style={styles.input}
            returnKeyType="done"
          />
        </View>

        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Lifetime harvest</Text>
          <Text style={styles.statsValue}>{profileLifetimeTotal.toLocaleString()}</Text>
          <Text style={styles.statsCopy}>
            This is the sum of every harvest you’ve collected across all sessions. Keep playing to grow
            your lifetime score.
          </Text>
        </View>

        <View style={styles.upgradeCard}>
          <Text style={styles.upgradeTitle}>Garden Plus customization</Text>
          {hasPremiumUpgrade ? (
            <>
              <Text style={styles.upgradeCopy}>Choose an accent color for your click target.</Text>
              <View style={styles.accentRow}>
                {PREMIUM_ACCENT_OPTIONS.map((color) => {
                  const isActive = accentSelection === color;
                  return (
                    <Pressable
                      key={color}
                      style={[styles.accentSwatch, { backgroundColor: color }, isActive && styles.accentSwatchActive]}
                      onPress={() => handleSelectAccent(color)}
                      accessibilityLabel={`Select accent color ${color}`}
                      accessibilityState={{ selected: isActive }}
                    >
                      {isActive ? <Text style={styles.accentSwatchCheck}>✓</Text> : null}
                    </Pressable>
                  );
                })}
              </View>
              <Text style={styles.upgradeCopy}>Pick the emoji that appears on the home canvas and menu.</Text>
              {emojiOptions.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.emojiRow}>
                  {emojiOptions.map((option) => {
                    const isSelected = option.emoji === customClickEmoji;
                    return (
                      <Pressable
                        key={option.id}
                        style={[styles.emojiChoice, isSelected && styles.emojiChoiceActive]}
                        onPress={() => handleChooseEmoji(option.emoji)}
                        accessibilityLabel={`Use ${option.emoji} as your click emoji`}
                        accessibilityState={{ selected: isSelected }}
                      >
                        <View style={[styles.emojiChoiceHalo, isSelected && styles.emojiChoiceHaloActive]} />
                        <View style={[styles.emojiChoiceInner, isSelected && styles.emojiChoiceInnerActive]}>
                          <Text style={[styles.emojiChoiceGlyph, isSelected && styles.emojiChoiceGlyphActive]}>
                            {option.emoji}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              ) : (
                <Text style={styles.emojiEmptyText}>Purchase garden decorations to see suggested emoji.</Text>
              )}
              <TextInput
                value={emojiInput}
                onChangeText={handleEmojiInputChange}
                placeholder="Type any emoji"
                style={styles.emojiInput}
                maxLength={6}
                autoCorrect={false}
                autoCapitalize="none"
                returnKeyType="done"
              />
              <Text style={styles.emojiNote}>
                Tip: tap a suggestion or type an emoji to update your click button and menu instantly.
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.upgradeCopy}>
                Upgrade for $2.99 to unlock custom emoji choices and accent colors for your garden clicker.
              </Text>
              <Pressable style={styles.upgradeButton} onPress={handleUpgrade} accessibilityLabel="Upgrade to Garden Plus">
                <Text style={styles.upgradeButtonText}>Upgrade for $2.99</Text>
              </Pressable>
            </>
          )}
        </View>

        <Pressable style={[styles.saveButton, isSaving && styles.saveButtonDisabled]} onPress={persistProfile} disabled={isSaving}>
          <Text style={styles.saveButtonText}>{isSaving ? 'Saving…' : 'Save profile'}</Text>
        </Pressable>
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
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  backLabel: {
    fontSize: 16,
    color: '#22543d',
    fontWeight: '600',
  },
  headerCard: {
    backgroundColor: '#22543d',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  avatarButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    fontSize: 48,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#f0fff4',
  },
  headerSubtitle: {
    color: '#c6f6d5',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 20,
  },
  removePhotoButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  removePhotoText: {
    color: '#f0fff4',
    fontWeight: '600',
  },
  formSection: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#22543d',
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#22543d',
    borderWidth: 1,
    borderColor: '#bee3f8',
  },
  statsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#22543d',
  },
  statsValue: {
    fontSize: 36,
    fontWeight: '800',
    color: '#2f855a',
  },
  statsCopy: {
    fontSize: 14,
    color: '#2d3748',
    lineHeight: 20,
  },
  upgradeCard: {
    backgroundColor: '#f0fff4',
    borderRadius: 20,
    padding: 20,
    gap: 16,
    shadowColor: '#0f766e',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  upgradeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#14532d',
  },
  upgradeCopy: {
    fontSize: 14,
    lineHeight: 20,
    color: '#1f2937',
  },
  accentRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  accentSwatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  accentSwatchActive: {
    borderColor: '#22543d',
    shadowColor: '#22543d',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  accentSwatchCheck: {
    color: '#f0fff4',
    fontWeight: '800',
  },
  emojiRow: {
    gap: 14,
    paddingVertical: 6,
  },
  emojiChoice: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  emojiChoiceActive: {
    transform: [{ scale: 1.03 }],
  },
  emojiChoiceHalo: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 32,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
  },
  emojiChoiceHaloActive: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
  },
  emojiChoiceInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(15, 118, 110, 0.25)',
    shadowColor: '#0f766e',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  emojiChoiceInnerActive: {
    backgroundColor: '#ecfdf3',
    borderColor: 'rgba(22, 101, 52, 0.45)',
  },
  emojiChoiceGlyph: {
    fontSize: 30,
  },
  emojiChoiceGlyphActive: {
    transform: [{ scale: 1.05 }],
  },
  emojiEmptyText: {
    fontSize: 13,
    color: '#2d3748',
  },
  emojiInput: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  emojiNote: {
    fontSize: 12,
    color: '#1f6f4a',
    lineHeight: 18,
  },
  upgradeButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#047857',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  upgradeButtonText: {
    color: '#f0fff4',
    fontWeight: '700',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#22543d',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#f0fff4',
    fontSize: 16,
    fontWeight: '700',
  },
});
