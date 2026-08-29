// =====================================================================
// db.js - Local SQLite Database Layer
// -----------------------------------------------------------------
// This file handles ALL local storage for the app.
// Two tables are created:
//   1. notes        -> stores title, body, tags, timestamps, sync flag
//   2. attachments   -> stores audio/image/file references linked to a note
//
// Why SQLite? It works fully offline, is fast, and is built into Expo
// via the "expo-sqlite" package. This satisfies the assignment's
// "Local Database" requirement (must work offline, must persist data).
// =====================================================================

import * as SQLite from 'expo-sqlite';

// Open (or create) the database file called "journal.db" on the device.
const db = SQLite.openDatabaseSync('journal.db');

// ---------------------------------------------------------------------
// INITIALIZE DATABASE
// Creates the tables if they don't already exist.
// Call this once when the app starts (see App.js).
// ---------------------------------------------------------------------
export function initDatabase() {
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
  db.runSync(
    `INSERT INTO notes (id, title, body, tags, created_at, updated_at, synced)
     VALUES (?, ?, ?, ?, ?, ?, 0);`,
    [id, title, body, tags || '', now, now]
  );
  return { id, title, body, tags, created_at: now, updated_at: now, synced: 0 };
}

// ---------------------------------------------------------------------
// NOTES: UPDATE (also resets synced=0 since the note changed locally)
// ---------------------------------------------------------------------
export function updateNote({ id, title, body, tags }) {
  const now = new Date().toISOString();
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
  db.runSync(`DELETE FROM attachments WHERE note_id = ?;`, [id]);
  db.runSync(`DELETE FROM notes WHERE id = ?;`, [id]);
}

// ---------------------------------------------------------------------
// NOTES: GET ALL (sorted by most recently updated first)
// ---------------------------------------------------------------------
export function getAllNotes() {
  return db.getAllSync(`SELECT * FROM notes ORDER BY updated_at DESC;`);
}

// ---------------------------------------------------------------------
// NOTES: GET ONE
// ---------------------------------------------------------------------
export function getNoteById(id) {
  return db.getFirstSync(`SELECT * FROM notes WHERE id = ?;`, [id]);
}

// ---------------------------------------------------------------------
// NOTES: GET ALL THAT ARE NOT YET SYNCED (used by the Supabase sync job)
// ---------------------------------------------------------------------
export function getUnsyncedNotes() {
  return db.getAllSync(`SELECT * FROM notes WHERE synced = 0;`);
}

// ---------------------------------------------------------------------
// NOTES: MARK AS SYNCED
// ---------------------------------------------------------------------
export function markNoteSynced(id) {
  db.runSync(`UPDATE notes SET synced = 1 WHERE id = ?;`, [id]);
}

// ---------------------------------------------------------------------
// ATTACHMENTS: ADD
// ---------------------------------------------------------------------
export function addAttachment({ id, note_id, type, local_uri, file_name }) {
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
  return db.getAllSync(`SELECT * FROM attachments WHERE note_id = ?;`, [note_id]);
}

// ---------------------------------------------------------------------
// ATTACHMENTS: DELETE ONE
// ---------------------------------------------------------------------
export function deleteAttachment(id) {
  db.runSync(`DELETE FROM attachments WHERE id = ?;`, [id]);
}

// ---------------------------------------------------------------------
// ATTACHMENTS: GET ALL UNSYNCED (used by sync job)
// ---------------------------------------------------------------------
export function getUnsyncedAttachments() {
  return db.getAllSync(`SELECT * FROM attachments WHERE synced = 0;`);
}

// ---------------------------------------------------------------------
// ATTACHMENTS: MARK SYNCED + SAVE REMOTE URL
// ---------------------------------------------------------------------
export function markAttachmentSynced(id, remote_url) {
  db.runSync(
    `UPDATE attachments SET synced = 1, remote_url = ? WHERE id = ?;`,
    [remote_url, id]
  );
}

// ---------------------------------------------------------------------
// DANGER ZONE: CLEAR ALL DATA (used by Settings screen "Clear Data" button)
// ---------------------------------------------------------------------
export function clearAllData() {
  db.execSync(`DELETE FROM attachments; DELETE FROM notes;`);
}

export default db;
