// =====================================================================
// HomeScreen.js - Notes List (Screen 1 of 4, per assignment section 6)
// -----------------------------------------------------------------
// - Displays all notes sorted by date (most recent first)
// - "+" button in the header to create a new note
// - Pull-to-refresh reloads from the local database
// - Tapping a note opens the Note Detail screen
// =====================================================================

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getAllNotes } from '../database/db';

export default function HomeScreen({ navigation }) {
  const [notes, setNotes] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  function loadNotes() {
    try {
      const allNotes = getAllNotes();
      setNotes(allNotes);
    } catch (err) {
      console.error('Failed to load notes', err);
    }
  }

  // Reload the notes list every time this screen comes into focus
  // (e.g. after saving a new note and navigating back)
  useFocusEffect(
    useCallback(() => {
      loadNotes();
    }, [])
  );

  function onRefresh() {
    setRefreshing(true);
    loadNotes();
    setRefreshing(false);
  }

  function renderNote({ item }) {
    const dateStr = new Date(item.updated_at).toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    return (
      <TouchableOpacity
        style={styles.noteCard}
        onPress={() => navigation.navigate('NoteDetail', { noteId: item.id })}
      >
        <View style={styles.noteHeaderRow}>
          <Text style={styles.noteTitle} numberOfLines={1}>
            {item.title || 'Untitled Note'}
          </Text>
          {item.synced === 0 && <View style={styles.unsyncedDot} />}
        </View>
        <Text style={styles.noteBody} numberOfLines={2}>
          {item.body || 'No content'}
        </Text>
        <View style={styles.noteFooterRow}>
          <Text style={styles.noteDate}>{dateStr}</Text>
          {!!item.tags && <Text style={styles.noteTags}>{item.tags}</Text>}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Journal</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('CreateEditNote')}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {notes.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No journal entries yet.</Text>
          <Text style={styles.emptySubText}>Tap "+" to write your first note.</Text>
        </View>
      ) : (
        <FlatList
          data={notes}
          keyExtractor={(item) => item.id}
          renderItem={renderNote}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      <TouchableOpacity
        style={styles.settingsButton}
        onPress={() => navigation.navigate('Settings')}
      >
        <Text style={styles.settingsButtonText}>⚙️ Settings</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  headerTitle: { fontSize: 28, fontWeight: '700', color: '#222' },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4A6FA5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: { color: '#fff', fontSize: 24, lineHeight: 26 },
  listContent: { paddingHorizontal: 16, paddingBottom: 90 },
  noteCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  noteHeaderRow: { flexDirection: 'row', alignItems: 'center' },
  noteTitle: { fontSize: 17, fontWeight: '600', color: '#222', flex: 1 },
  unsyncedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E0A800',
    marginLeft: 6,
  },
  noteBody: { fontSize: 14, color: '#666', marginTop: 6 },
  noteFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  noteDate: { fontSize: 12, color: '#999' },
  noteTags: { fontSize: 12, color: '#4A6FA5' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 16, color: '#666', fontWeight: '600' },
  emptySubText: { fontSize: 13, color: '#999', marginTop: 4 },
  settingsButton: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  settingsButtonText: { color: '#444', fontWeight: '600' },
});
