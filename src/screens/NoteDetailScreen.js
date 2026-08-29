// =====================================================================
// NoteDetailScreen.js - Note Detail (Screen 3 of 4)
// -----------------------------------------------------------------
// - Displays note text, all attachments (images previewed, audio
//   playable), and gives Edit / Delete actions.
// =====================================================================

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getNoteById, getAttachmentsForNote, deleteNote } from '../database/db';
import AudioPlayer from '../components/AudioPlayer';

export default function NoteDetailScreen({ route, navigation }) {
  const { noteId } = route.params;
  const [note, setNote] = useState(null);
  const [attachments, setAttachments] = useState([]);

  function loadData() {
    const n = getNoteById(noteId);
    setNote(n);
    setAttachments(getAttachmentsForNote(noteId));
  }

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [noteId])
  );

  function handleDelete() {
    Alert.alert('Delete Note', 'This will permanently delete this note and its attachments.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteNote(noteId);
          navigation.goBack();
        },
      },
    ]);
  }

  if (!note) {
    return (
      <View style={styles.centered}>
        <Text>Note not found.</Text>
      </View>
    );
  }

  const images = attachments.filter((a) => a.type === 'image');
  const audios = attachments.filter((a) => a.type === 'audio');
  const files = attachments.filter((a) => a.type === 'file');

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => navigation.navigate('CreateEditNote', { noteId })}
          >
            <Text style={styles.actionText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete}>
            <Text style={[styles.actionText, { color: '#D9534F' }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.title}>{note.title}</Text>
      <Text style={styles.date}>
        {new Date(note.updated_at).toLocaleString()}
        {note.synced === 0 ? '  •  Not synced' : '  •  Synced'}
      </Text>
      {!!note.tags && <Text style={styles.tags}>{note.tags}</Text>}

      <Text style={styles.body}>{note.body}</Text>

      {audios.length > 0 && (
        <>
          <Text style={styles.sectionLabel}>Audio Notes</Text>
          {audios.map((att) => (
            <AudioPlayer key={att.id} uri={att.local_uri} />
          ))}
        </>
      )}

      {images.length > 0 && (
        <>
          <Text style={styles.sectionLabel}>Images</Text>
          <View style={styles.imageGrid}>
            {images.map((att) => (
              <Image key={att.id} source={{ uri: att.local_uri }} style={styles.image} />
            ))}
          </View>
        </>
      )}

      {files.length > 0 && (
        <>
          <Text style={styles.sectionLabel}>Files</Text>
          {files.map((att) => (
            <View key={att.id} style={styles.fileRow}>
              <Text style={styles.fileText} numberOfLines={1}>
                📎 {att.file_name || 'Attachment'}
              </Text>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 20 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 10,
  },
  backText: { color: '#4A6FA5', fontSize: 16 },
  headerActions: { flexDirection: 'row', gap: 16 },
  actionText: { color: '#4A6FA5', fontSize: 15, fontWeight: '600', marginLeft: 16 },
  title: { fontSize: 24, fontWeight: '700', marginTop: 10 },
  date: { fontSize: 12, color: '#999', marginTop: 4 },
  tags: { fontSize: 13, color: '#4A6FA5', marginTop: 6 },
  body: { fontSize: 16, color: '#333', marginTop: 16, lineHeight: 22 },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: '#888', marginTop: 20, marginBottom: 6 },
  imageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  image: { width: 100, height: 100, borderRadius: 10 },
  fileRow: { backgroundColor: '#F0F2F5', borderRadius: 10, padding: 10, marginVertical: 4 },
  fileText: { color: '#333' },
});
