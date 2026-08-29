# Technical Report — Mobile Journal App

**Project:** Proxie Studio App Development Evaluation (Round 1)
**Framework:** React Native (Expo)

---

## 1. Database Structure

The app uses a **local-first architecture**: all data is written to an on-device SQLite database first, and cloud sync (Supabase) is a secondary, optional step. This guarantees the app is fully usable offline, per the assignment's requirement.

**`notes` table**

| Column | Type | Description |
|---|---|---|
| id | TEXT (PK) | Unique note identifier |
| title | TEXT | Note title |
| body | TEXT | Note content |
| tags | TEXT | Comma-separated tags |
| created_at | TEXT (ISO date) | Creation timestamp |
| updated_at | TEXT (ISO date) | Last edit timestamp |
| synced | INTEGER (0/1) | Whether this note has been uploaded to Supabase |

**`attachments` table**

| Column | Type | Description |
|---|---|---|
| id | TEXT (PK) | Unique attachment identifier |
| note_id | TEXT (FK) | Links to `notes.id`, cascade deletes with the note |
| type | TEXT | `audio`, `image`, or `file` |
| local_uri | TEXT | Path to the file in the app's local document storage |
| remote_url | TEXT | Public URL after upload to Supabase Storage (null until synced) |
| file_name | TEXT | Original file name, shown in the UI |
| synced | INTEGER (0/1) | Whether this file has been uploaded |

The `synced` flag on both tables is the core mechanism for the sync-status feature required in section 4.4 of the brief. Any local create/edit resets `synced` to `0`, which is how the sync service knows what still needs uploading.

Attachments are copied from their original picker location (camera roll / cache) into the app's permanent `documentDirectory/attachments/` folder immediately when picked, so the app does not depend on temporary system paths that could be cleared.

---

## 2. APIs Used

- **Supabase Postgres (REST via supabase-js)** — stores note metadata (`notes` table) and attachment references (`attachments` table) for cloud backup/restore.
- **Supabase Storage** — stores the actual audio/image binary files in a `media` bucket, addressed by `note_id/attachment_id.ext`.
- **Expo native APIs** (not third-party HTTP APIs, but system-level "APIs" per the brief's Hardware Access section):
  - `expo-av` for microphone recording and audio playback.
  - `expo-image-picker` for camera capture and gallery selection.
  - `expo-document-picker` for generic file selection.
  - `expo-file-system` for reading/writing/copying files on disk.

All Supabase calls are `async/await`-based and wrapped in `try/catch`, with per-item error handling in the sync loop so that one failed upload does not block the rest of the batch — this satisfies the "robust error handling" requirement in section 7.

---

## 3. Key Implementation Challenges & Learnings

**1. Offline-first vs. cloud-first design.**
The biggest architectural decision was making Supabase entirely optional rather than a dependency. Every write operation happens against SQLite synchronously first; the UI never waits on a network call to save a note. This meant designing the `synced` flag from day one instead of retrofitting it later, since it's what allows the app to "queue up" changes made while offline and push them later.

**2. File lifecycle management.**
Files picked from the camera roll or file system can live in temporary/cache directories that the OS may clear. The fix was to immediately copy every picked file into the app's own permanent `documentDirectory`, and store that new path in SQLite — decoupling the app's data from the source location the file was picked from.

**3. Uploading binary files to Supabase Storage from React Native.**
`fetch`'s Blob support is inconsistent across React Native environments, so files are read as base64 via `expo-file-system` and converted to a `Uint8Array` before upload, which is the reliable path for the Supabase JS SDK in this environment.

**4. Permission UX.**
Rather than requesting camera/microphone/storage permissions at app launch, each permission is requested only at the moment the relevant feature (record / camera / gallery) is used, with a clear explanation shown if the user denies it — this avoids the common "wall of permission prompts" pattern and matches platform (iOS/Android) best practice.

**5. Partial sync failures.**
Early versions of the sync function failed the entire batch if a single note or file failed to upload. This was refactored so each note/attachment is uploaded in its own try/catch inside the loop, so a single bad file (e.g. corrupted audio) doesn't prevent the rest of the day's notes from syncing.

---

## 4. Testing Performed

- Created, edited, and deleted text notes — confirmed persistence after app restart.
- Recorded multiple audio notes, confirmed play/pause/delete works correctly.
- Attached images from camera and gallery, and a document from file storage.
- Enabled Airplane Mode and confirmed full CRUD functionality with no crashes (offline resilience).
- Ran "Sync Now" after reconnecting and confirmed notes appear in the Supabase dashboard with correctly linked public storage URLs.
