// =====================================================================
// AudioPlayer.js - Play / Pause / Delete a recorded audio attachment
// -----------------------------------------------------------------
// Covers assignment section 4.2 ("Play, pause, and delete recordings")
// =====================================================================

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Audio } from 'expo-av';

export default function AudioPlayer({ uri, onDelete }) {
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Unload the sound from memory when this component is removed
  // (prevents memory leaks - important for "robust" code per assignment)
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  async function playPauseAudio() {
    try {
      if (sound) {
        const status = await sound.getStatusAsync();
        if (status.isPlaying) {
          await sound.pauseAsync();
          setIsPlaying(false);
        } else {
          await sound.playAsync();
          setIsPlaying(true);
        }
        return;
      }

      // No sound loaded yet -> load and play it for the first time
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true },
        (status) => {
          if (status.didJustFinish) {
            setIsPlaying(false);
          }
        }
      );

      setSound(newSound);
      setIsPlaying(true);
    } catch (err) {
      console.error('Failed to play audio', err);
      Alert.alert('Playback Error', 'Could not play this audio recording.');
    }
  }

  function confirmDelete() {
    Alert.alert('Delete Recording', 'Remove this audio recording from the note?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: onDelete },
    ]);
  }

  return (
    <View style={styles.row}>
      <TouchableOpacity style={styles.playButton} onPress={playPauseAudio}>
        <Text style={styles.playButtonText}>{isPlaying ? '⏸ Pause' : '▶️ Play'}</Text>
      </TouchableOpacity>
      <Text style={styles.label}>Audio Note</Text>
      {onDelete && (
        <TouchableOpacity onPress={confirmDelete}>
          <Text style={styles.deleteText}>🗑</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F2F5',
    borderRadius: 10,
    padding: 10,
    marginVertical: 4,
  },
  playButton: {
    backgroundColor: '#4A6FA5',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginRight: 10,
  },
  playButtonText: { color: '#fff', fontWeight: '600' },
  label: { flex: 1, color: '#333' },
  deleteText: { fontSize: 18, paddingHorizontal: 6 },
});
