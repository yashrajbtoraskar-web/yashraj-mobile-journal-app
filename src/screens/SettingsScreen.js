// =====================================================================
// SettingsScreen.js - Settings (Screen 4 of 4)
// -----------------------------------------------------------------
// - "Sync Now" button that uploads unsynced notes/attachments to Supabase
// - "Clear All Data" button (with confirmation)
// - Shows last sync result / basic status text
// =====================================================================

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { clearAllData } from '../database/db';
import { syncAllData } from '../services/supabase';

export default function SettingsScreen({ navigation }) {
  const [syncing, setSyncing] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  // -------------------------------------------------------------
  // SYNC NOW
  // Calls the Supabase sync service. Handles both success and
  // failure (e.g. no internet connection) gracefully.
  // -------------------------------------------------------------
  async function handleSyncNow() {
    setSyncing(true);
    setLastResult(null);
    try {
      const result = await syncAllData();
      setLastResult(result);

      if (result.success) {
        Alert.alert(
          'Sync Complete',
          `Synced ${result.notesSynced} note(s) and ${result.attachmentsSynced} attachment(s).`
        );
      } else {
        Alert.alert('Sync Failed', result.error || 'Could not connect to the server. Check your internet connection.');
      }
    } catch (err) {
      Alert.alert('Sync Failed', 'An unexpected error occurred. Please try again.');
    } finally {
      setSyncing(false);
    }
  }

  // -------------------------------------------------------------
  // CLEAR ALL DATA
  // -------------------------------------------------------------
  function handleClearData() {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete every note and attachment stored on this device. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Everything',
          style: 'destructive',
          onPress: () => {
            clearAllData();
            Alert.alert('Done', 'All local data has been cleared.');
            navigation.navigate('Home');
          },
        },
      ]
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 50 }} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cloud Sync</Text>
        <Text style={styles.sectionDesc}>
          Upload your notes and attachments to the cloud so they're backed up and available on
          other devices.
        </Text>

        <TouchableOpacity
          style={[styles.button, syncing && styles.buttonDisabled]}
          onPress={handleSyncNow}
          disabled={syncing}
        >
          {syncing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>☁️ Sync Now</Text>
          )}
        </TouchableOpacity>

        {lastResult && lastResult.success && (
          <Text style={styles.resultText}>
            Last sync: {lastResult.notesSynced} note(s), {lastResult.attachmentsSynced} file(s)
          </Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Management</Text>
        <Text style={styles.sectionDesc}>
          Remove every note and attachment stored locally on this device.
        </Text>
        <TouchableOpacity style={styles.dangerButton} onPress={handleClearData}>
          <Text style={styles.dangerButtonText}>🗑 Clear All Data</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.sectionDesc}>Mobile Journal App — v1.0.0{'\n'}Built with React Native (Expo) + SQLite + Supabase</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA', paddingHorizontal: 20 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
  },
  backText: { color: '#4A6FA5', fontSize: 16 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  section: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#222', marginBottom: 6 },
  sectionDesc: { fontSize: 13, color: '#777', marginBottom: 12, lineHeight: 18 },
  button: {
    backgroundColor: '#4A6FA5',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '700' },
  resultText: { fontSize: 12, color: '#4A6FA5', marginTop: 10, textAlign: 'center' },
  dangerButton: {
    backgroundColor: '#FBEAEA',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  dangerButtonText: { color: '#D9534F', fontWeight: '700' },
});
