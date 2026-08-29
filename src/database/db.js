// =====================================================================
// db.js - Local Database Layer
// -----------------------------------------------------------------
// This file handles ALL local storage for the app.
// Two tables are created:
//   1. notes        -> stores title, body, tags, timestamps, sync flag
//   2. attachments   -> stores audio/image/file references linked to a note
//
// On Android/iOS this uses real SQLite (expo-sqlite), which works fully
// offline, is fast, and satisfies the assignment's "Local Database"
// requirement. On web, expo-sqlite's WebAssembly engine is not reliably
// bundleable by every build host, so we fall back to a simple in-memory
// store with the exact same function signatures — this keeps the web
// preview build working for demo purposes. The web fallback resets on
// page refresh; the mobile app (Android/iOS) always uses real, persistent
// SQLite storage.
// =====================================================================

import { Platform } from 'react-native';

const IS_WEB = Platform.OS === 'web';

let db = null;
if (!IS_WEB) {
  // eslint-disable-next-line global-require
  const SQLite = require('expo-sqlite');
  db = SQLite.openDatabaseSync('journal.db');
}

// ---------------------------------------------------------------------
// WEB FALLBACK: simple in-memory arrays mimicking the two tables
// ---------------------------------------------------------------------
const memory = {
  notes: [],
  attachments: [],
};

// ---------------------------------------------------------------------
// INITIALIZE DATABASE
// Creates the tables if they don't already exist (native only).
// Call this once when the app starts (see App.js).
// ---------------------------------------------------------------------
export function initDatabase() {
  if (IS_WEB) return;
  db.execSync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      body TEXT,
      tags TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      synced INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS attachments (
      id TEXT PRIMARY KEY NOT NULL,
      note_id TEXT NOT NULL,
      type TEXT NOT NULL,           -- 'audio' | 'image' | 'file'
      local_uri TEXT NOT NULL,
      remote_url TEXT,
      file_name TEXT,
      synced INTEGER DEFAULT 0,
      FOREIGN KEY (note_id) REFERENCES notes (id) ON DELETE CASCADE
    );
  `);
}

// ---------------------------------------------------------------------
// NOTES: CREATE
// ---------------------------------------------------------------------
export function createNote({ id, title, body, tags }) {
  const now = new Date().toISOString();
  const note = { id, title, body, tags: tags || '', created_at: now, updated_at: now, synced: 0 };
  if (IS_WEB) {
    memory.notes.unshift(note);
    return note;
  }
  db.runSync(
    `INSERT INTO notes (id, title, body, tags, created_at, updated_at, synced)
     VALUES (?, ?, ?, ?, ?, ?, 0);`,
    [id, title, body, tags || '', now, now]
  );
  return note;
}

// ---------------------------------------------------------------------
// NOTES: UPDATE (also resets synced=0 since the note changed locally)
// ---------------------------------------------------------------------
export function updateNote({ id, title, body, tags }) {
  const now = new Date().toISOString();
  if (IS_WEB) {
    const n = memory.notes.find((x) => x.id === id);
    if (n) Object.assign(n, { title, body, tags: tags || '', updated_at: now, synced: 0 });
    return;
  }
  db.runSync(
    `UPDATE notes SET title = ?, body = ?, tags = ?, updated_at = ?, synced = 0
     WHERE id = ?;`,
    [title, body, tags || '', now, id]
  );
}

// ---------------------------------------------------------------------
// NOTES: DELETE (attachments are removed by the calling screen so their
// local files can be cleaned up from the filesystem too)
// ---------------------------------------------------------------------
export function deleteNote(id) {
  if (IS_WEB) {
    memory.attachments = memory.attachments.filter((a) => a.note_id !== id);
    memory.notes = memory.notes.filter((n) => n.id !== id);
    return;
  }
  db.runSync(`DELETE FROM attachments WHERE note_id = ?;`, [id]);
  db.runSync(`DELETE FROM notes WHERE id = ?;`, [id]);
}

// ---------------------------------------------------------------------
// NOTES: GET ALL (sorted by most recently updated first)
// ---------------------------------------------------------------------
export function getAllNotes() {
  if (IS_WEB) {
    return [...memory.notes].sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1));
  }
  return db.getAllSync(`SELECT * FROM notes ORDER BY updated_at DESC;`);
}

// ---------------------------------------------------------------------
// NOTES: GET ONE
// ---------------------------------------------------------------------
export function getNoteById(id) {
  if (IS_WEB) {
    return memory.notes.find((n) => n.id === id) || null;
  }
  return db.getFirstSync(`SELECT * FROM notes WHERE id = ?;`, [id]);
}

// ---------------------------------------------------------------------
// NOTES: GET ALL THAT ARE NOT YET SYNCED (used by the Supabase sync job)
// ---------------------------------------------------------------------
export function getUnsyncedNotes() {
  if (IS_WEB) {
    return memory.notes.filter((n) => n.synced === 0);
  }
  return db.getAllSync(`SELECT * FROM notes WHERE synced = 0;`);
}

// ---------------------------------------------------------------------
// NOTES: MARK AS SYNCED
// ---------------------------------------------------------------------
export function markNoteSynced(id) {
  if (IS_WEB) {
    const n = memory.notes.find((x) => x.id === id);
    if (n) n.synced = 1;
    return;
  }
  db.runSync(`UPDATE notes SET synced = 1 WHERE id = ?;`, [id]);
}

// ---------------------------------------------------------------------
// ATTACHMENTS: ADD
// ---------------------------------------------------------------------
export function addAttachment({ id, note_id, type, local_uri, file_name }) {
  if (IS_WEB) {
    memory.attachments.push({ id, note_id, type, local_uri, remote_url: null, file_name: file_name || '', synced: 0 });
    return;
  }
  db.runSync(
    `INSERT INTO attachments (id, note_id, type, local_uri, file_name, synced)
     VALUES (?, ?, ?, ?, ?, 0);`,
    [id, note_id, type, local_uri, file_name || '']
  );
}

// ---------------------------------------------------------------------
// ATTACHMENTS: GET ALL FOR A NOTE
// ---------------------------------------------------------------------
export function getAttachmentsForNote(note_id) {
  if (IS_WEB) {
    return memory.attachments.filter((a) => a.note_id === note_id);
  }
  return db.getAllSync(`SELECT * FROM attachments WHERE note_id = ?;`, [note_id]);
}

// ---------------------------------------------------------------------
// ATTACHMENTS: DELETE ONE
// ---------------------------------------------------------------------
export function deleteAttachment(id) {
  if (IS_WEB) {
    memory.attachments = memory.attachments.filter((a) => a.id !== id);
    return;
  }
  db.runSync(`DELETE FROM attachments WHERE id = ?;`, [id]);
}

// ---------------------------------------------------------------------
// ATTACHMENTS: GET ALL UNSYNCED (used by sync job)
// ---------------------------------------------------------------------
export function getUnsyncedAttachments() {
  if (IS_WEB) {
    return memory.attachments.filter((a) => a.synced === 0);
  }
  return db.getAllSync(`SELECT * FROM attachments WHERE synced = 0;`);
}

// ---------------------------------------------------------------------
// ATTACHMENTS: MARK SYNCED + SAVE REMOTE URL
// ---------------------------------------------------------------------
export function markAttachmentSynced(id, remote_url) {
  if (IS_WEB) {
    const a = memory.attachments.find((x) => x.id === id);
    if (a) { a.synced = 1; a.remote_url = remote_url; }
    return;
  }
  db.runSync(
    `UPDATE attachments SET synced = 1, remote_url = ? WHERE id = ?;`,
    [remote_url, id]
  );
}

// ---------------------------------------------------------------------
// DANGER ZONE: CLEAR ALL DATA (used by Settings screen "Clear Data" button)
// ---------------------------------------------------------------------
export function clearAllData() {
  if (IS_WEB) {
    memory.notes = [];
    memory.attachments = [];
    return;
  }
  db.execSync(`DELETE FROM attachments; DELETE FROM notes;`);
}

export default db;
