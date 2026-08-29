// =====================================================================
// CreateEditNoteScreen.js - Create / Edit Note (Screen 2 of 4)
// -----------------------------------------------------------------
// - Text editor for title + body + tags
// - "Record Audio" button (AudioRecorder component)
// - "Attach" buttons for camera / gallery / file (AttachmentPicker)
// - Saves everything to the local SQLite database
// =====================================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  createNote,
  updateNote,
  getNoteById,
  addAttachment,
  getAttachmentsForNote,
  deleteAttachment,
} from '../database/db';
import { generateId } from '../utils/uuid';
import AudioRecorder from '../components/AudioRecorder';
import AudioPlayer from '../components/AudioPlayer';
import AttachmentPicker from '../components/AttachmentPicker';

export default function CreateEditNoteScreen({ route, navigation }) {
  const existingNoteId = route.params?.noteId || null;

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tags, setTags] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [noteId] = useState(existingNoteId || generateId());

  // Load existing note data if we're editing (not creating new)
  useEffect(() => {
    if (existingNoteId) {
      const existing = getNoteById(existingNoteId);
      if (existing) {
        setTitle(existing.title);
        setBody(existing.body);
        setTags(existing.tags || '');
      }
      setAttachments(getAttachmentsForNote(existingNoteId));
    }
  }, [existingNoteId]);

  // -------------------------------------------------------------
  // SAVE NOTE (create or update depending on whether we had an ID)
  // -------------------------------------------------------------
  function handleSave() {
    if (!title.trim() && !body.trim()) {
      Alert.alert('Empty Note', 'Please add a title or some text before saving.');
      return;
    }

    try {
      const alreadyInDb = getNoteById(noteId);
      if (alreadyInDb) {
        updateNote({ id: noteId, title: title.trim() || 'Untitled', body, tags });
      } else {
        createNote({ id: noteId, title: title.trim() || 'Untitled', body, tags });
      }
      navigation.goBack();
    } catch (err) {
      console.error('Failed to save note', err);
      Alert.alert('Save Error', 'Could not save the note. Please try again.');
    }
  }

  // -------------------------------------------------------------
  // ATTACHMENT HANDLERS
  // Each attachment is saved to the DB immediately so nothing is
  // lost if the user backs out without pressing "Save".
  // Note: a placeholder row for the note must exist first, so we
  // silently create the note record on first attachment if needed.
  // -------------------------------------------------------------
  function ensureNoteExists() {
    const existing = getNoteById(noteId);
    if (!existing) {
      createNote({ id: noteId, title: title.trim() || 'Untitled', body, tags });
    }
  }

  function handleAudioRecorded(uri) {
    ensureNoteExists();
    const attachmentId = generateId();
    addAttachment({ id: attachmentId, note_id: noteId, type: 'audio', local_uri: uri });
    setAttachments(getAttachmentsForNote(noteId));
  }

  function handleImageAdded(uri, fileName) {
    ensureNoteExists();
    const attachmentId = generateId();
    addAttachment({
      id: attachmentId,
      note_id: noteId,
      type: 'image',
      local_uri: uri,
      file_name: fileName,
    });
    setAttachments(getAttachmentsForNote(noteId));
  }

  function handleFileAdded(uri, fileName) {
    ensureNoteExists();
    const attachmentId = generateId();
    addAttachment({
      id: attachmentId,
      note_id: noteId,
      type: 'file',
      local_uri: uri,
      file_name: fileName,
    });
    setAttachments(getAttachmentsForNote(noteId));
  }

  function handleDeleteAttachment(attachmentId) {
    deleteAttachment(attachmentId);
    setAttachments(getAttachmentsForNote(noteId));
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSave}>
            <Text style={styles.saveText}>Save</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.titleInput}
          placeholder="Title"
          value={title}
          onChangeText={setTitle}
        />

        <TextInput
          style={styles.bodyInput}
          placeholder="Write your journal entry..."
          value={body}
          onChangeText={setBody}
          multiline
          textAlignVertical="top"
        />

        <TextInput
          style={styles.tagsInput}
          placeholder="Tags (comma separated, optional)"
          value={tags}
          onChangeText={setTags}
        />

        <Text style={styles.sectionLabel}>Audio</Text>
        <AudioRecorder onRecordingComplete={handleAudioRecorded} />

        <Text style={styles.sectionLabel}>Attachments</Text>
        <AttachmentPicker onImageAdded={handleImageAdded} onFileAdded={handleFileAdded} />

        {attachments.map((att) =>
          att.type === 'audio' ? (
            <AudioPlayer
              key={att.id}
              uri={att.local_uri}
              onDelete={() => handleDeleteAttachment(att.id)}
            />
          ) : (
            <View key={att.id} style={styles.fileRow}>
              <Text style={styles.fileText} numberOfLines={1}>
                {att.type === 'image' ? '🖼' : '📎'} {att.file_name || 'Attachment'}
              </Text>
              <TouchableOpacity onPress={() => handleDeleteAttachment(att.id)}>
                <Text style={styles.deleteText}>🗑</Text>
              </TouchableOpacity>
            </View>
          )
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 20 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 16,
  },
  cancelText: { color: '#999', fontSize: 16 },
  saveText: { color: '#4A6FA5', fontSize: 16, fontWeight: '700' },
  titleInput: { fontSize: 22, fontWeight: '700', paddingVertical: 8 },
  bodyInput: { fontSize: 16, minHeight: 140, paddingVertical: 8, color: '#333' },
  tagsInput: {
    fontSize: 14,
    color: '#4A6FA5',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingVertical: 10,
    marginBottom: 6,
  },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: '#888', marginTop: 14, marginBottom: 4 },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F2F5',
    borderRadius: 10,
    padding: 10,
    marginVertical: 4,
  },
  fileText: { flex: 1, color: '#333' },
  deleteText: { fontSize: 18, paddingHorizontal: 6 },
});
