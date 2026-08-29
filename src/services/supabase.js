// =====================================================================
// supabase.js - Cloud Sync Service (OPTIONAL feature, per assignment 4.5)
// -----------------------------------------------------------------
// This file:
//   1. Sets up the Supabase client (connects to your project using the
//      URL + anon key you will put in a .env file).
//   2. Provides a syncAllData() function that:
//        - Finds every note/attachment that is NOT yet synced locally
//        - Uploads note metadata to the "notes" table in Supabase
//        - Uploads attachment files (audio/images) to Supabase Storage
//        - Marks each item as synced=1 locally once upload succeeds
//   3. Provides a fetchNotesFromCloud() function to restore/download data.
//
// IMPORTANT: This uses "async/await" (Promises) everywhere, and every
// network call is wrapped in try/catch for robust error handling, as
// required by the assignment (section 7 - Technical Expectations).
// =====================================================================

import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import {
  getUnsyncedNotes,
  getUnsyncedAttachments,
  markNoteSynced,
  markAttachmentSynced,
} from '../database/db';

// -----------------------------------------------------------------
// 1. SUPABASE CLIENT SETUP
// -----------------------------------------------------------------
// Replace these with your own project's values, OR (recommended) put
// them in a .env file and load with something like react-native-dotenv.
// For simplicity in this starter project, edit the two lines below:
const SUPABASE_URL = 'https://wyvcckkkezrbafuhwvxz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_IU4gT7NP2VIFmjG0WvBqKw_QcwCd9s8';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// -----------------------------------------------------------------
// 2. CHECK INTERNET / SUPABASE REACHABILITY
// A simple helper so screens can show "offline" messaging.
// -----------------------------------------------------------------
export async function isSupabaseReachable() {
  try {
    const { error } = await supabase.from('notes').select('id').limit(1);
    return !error;
  } catch (err) {
    return false;
  }
}

// -----------------------------------------------------------------
// 3. UPLOAD ONE ATTACHMENT FILE TO SUPABASE STORAGE
// Reads the local file as base64, converts it, and uploads to the
// "media" bucket. Returns the public URL on success.
// -----------------------------------------------------------------
async function uploadAttachmentFile(attachment) {
  const fileExt = attachment.local_uri.split('.').pop();
  const storagePath = `${attachment.note_id}/${attachment.id}.${fileExt}`;

  // Read the file from the device as base64
  const base64 = await FileSystem.readAsStringAsync(attachment.local_uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  // Convert base64 string to a binary ArrayBuffer for upload
  const binary = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

  const { error } = await supabase.storage
    .from('media')
    .upload(storagePath, binary, {
      contentType: attachment.type === 'audio' ? 'audio/m4a' : 'image/jpeg',
      upsert: true,
    });

  if (error) throw error;

  const { data } = supabase.storage.from('media').getPublicUrl(storagePath);
  return data.publicUrl;
}

// -----------------------------------------------------------------
// 4. MAIN SYNC FUNCTION
// Called from the Settings screen "Sync Now" button.
// Returns a summary object: { success, notesSynced, attachmentsSynced, error }
// -----------------------------------------------------------------
export async function syncAllData() {
  const summary = { success: true, notesSynced: 0, attachmentsSynced: 0, error: null };

  try {
    // --- Step 1: Upload unsynced notes (metadata only) ---
    const unsyncedNotes = getUnsyncedNotes();

    for (const note of unsyncedNotes) {
      const { error } = await supabase.from('notes').upsert({
        id: note.id,
        title: note.title,
        body: note.body,
        tags: note.tags,
        created_at: note.created_at,
        updated_at: note.updated_at,
      });

      if (error) {
        // Don't stop the whole sync - log and continue with other notes
        console.warn('Failed to sync note', note.id, error.message);
        continue;
      }

      markNoteSynced(note.id);
      summary.notesSynced += 1;
    }

    // --- Step 2: Upload unsynced attachment files ---
    const unsyncedAttachments = getUnsyncedAttachments();

    for (const attachment of unsyncedAttachments) {
      try {
        const publicUrl = await uploadAttachmentFile(attachment);

        // Save a reference row in the "attachments" table in Supabase too
        await supabase.from('attachments').upsert({
          id: attachment.id,
          note_id: attachment.note_id,
          type: attachment.type,
          remote_url: publicUrl,
          file_name: attachment.file_name,
        });

        markAttachmentSynced(attachment.id, publicUrl);
        summary.attachmentsSynced += 1;
      } catch (fileErr) {
        console.warn('Failed to sync attachment', attachment.id, fileErr.message);
        // Continue with the next attachment instead of failing everything
      }
    }
  } catch (err) {
    summary.success = false;
    summary.error = err.message || 'Unknown sync error';
  }

  return summary;
}

// -----------------------------------------------------------------
// 5. FETCH / RESTORE DATA FROM CLOUD
// Useful if the user reinstalls the app or switches devices.
// -----------------------------------------------------------------
export async function fetchNotesFromCloud() {
  try {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return { success: true, notes: data };
  } catch (err) {
    return { success: false, notes: [], error: err.message };
  }
}
