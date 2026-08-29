// =====================================================================
// AudioRecorder.js - Record audio notes using the device microphone
// -----------------------------------------------------------------
// Covers assignment section 4.2 (Audio) and Hardware Access (mic
// permission handling). Uses "expo-av" Audio API.
// =====================================================================

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Audio } from 'expo-av';

export default function AudioRecorder({ onRecordingComplete }) {
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [durationMillis, setDurationMillis] = useState(0);

  // Clean up the recording object if the component unmounts mid-recording
  useEffect(() => {
    return () => {
      if (recording) {
        recording.stopAndUnloadAsync().catch(() => {});
      }
    };
  }, [recording]);

  // -------------------------------------------------------------
  // START RECORDING
  // Step 1: Ask for microphone permission
  // Step 2: Configure audio mode for recording
  // Step 3: Start the recording
  // -------------------------------------------------------------
  async function startRecording() {
    try {
      const permissionResponse = await Audio.requestPermissionsAsync();

      if (permissionResponse.status !== 'granted') {
        Alert.alert(
          'Microphone Permission Needed',
          'Please allow microphone access in your device settings to record audio notes.'
        );
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
        (status) => {
          if (status.isRecording) {
            setDurationMillis(status.durationMillis);
          }
        }
      );

      setRecording(newRecording);
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Recording Error', 'Could not start audio recording. Please try again.');
    }
  }

  // -------------------------------------------------------------
  // STOP RECORDING
  // Retrieves the saved file URI and passes it up to the parent
  // (CreateEditNoteScreen), which will save it into the local DB.
  // -------------------------------------------------------------
  async function stopRecording() {
    try {
      if (!recording) return;

      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

      const uri = recording.getURI();
      setIsRecording(false);
      setRecording(null);
      setDurationMillis(0);

      if (uri) {
        onRecordingComplete(uri);
      }
    } catch (err) {
      console.error('Failed to stop recording', err);
      Alert.alert('Recording Error', 'Could not save the audio recording.');
    }
  }

  function formatDuration(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, isRecording && styles.buttonRecording]}
        onPress={isRecording ? stopRecording : startRecording}
      >
        <Text style={styles.buttonText}>
          {isRecording ? `⏹ Stop (${formatDuration(durationMillis)})` : '🎤 Record Audio'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: 8 },
  button: {
    backgroundColor: '#4A6FA5',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonRecording: {
    backgroundColor: '#D9534F',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
});
