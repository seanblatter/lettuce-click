import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

import { useGame } from '@/context/GameContext';

export default function ProfileScreen() {
  const {
    profileName,
    profileUsername,
    profileImageUri,
    profileLifetimeTotal,
    setProfileName,
    setProfileUsername,
    setProfileImageUri,
  } = useGame();
  const router = useRouter();
  const [name, setName] = useState(profileName);
  const [username, setUsername] = useState(profileUsername);
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setName(profileName);
  }, [profileName]);

  useEffect(() => {
    setUsername(profileUsername);
  }, [profileUsername]);

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
          <Text style={styles.headerSubtitle}>Personalize your gardener identity and celebrate your harvest.</Text>
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
