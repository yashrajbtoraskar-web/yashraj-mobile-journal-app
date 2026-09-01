🌐 Live Demo Web Preview: https://marvelous-churros-7a866c.netlify.app/# Mobile Journal App

A cross-platform mobile journaling app built for the **Proxie Studio App Development Evaluation (Round 1)**.

Users can write text journal entries, record audio notes, attach photos/files, and everything works fully offline using a local SQLite database. Notes can optionally be synced to a Supabase cloud backend.

---

## Features

- ✏️ Create, edit, and delete text notes (title, body, tags, timestamp)
- 🎤 Record, play, pause, and delete audio notes using the device microphone
- 📷 Capture photos with the camera or pick images from the gallery
- 📎 Attach any file from device storage
- 💾 Fully offline local database (SQLite) — the app works with no internet connection
- ☁️ Optional cloud sync to Supabase (notes metadata + media files)
- 🔄 Per-item `synced` flag so the app knows what still needs to be uploaded

---

## Tech Stack / Libraries Used

| Library | Purpose |
|---|---|
| `expo` | React Native framework / tooling |
| `expo-sqlite` | Local offline database |
| `expo-av` | Audio recording and playback |
| `expo-image-picker` | Camera capture + gallery image selection |
| `expo-document-picker` | Picking arbitrary files from device storage |
| `expo-file-system` | Copying attachments into permanent app storage, reading files for upload |
| `@react-navigation/native` + `native-stack` | Navigation between the 4 screens |
| `@supabase/supabase-js` | Cloud database + file storage sync |
| `@react-native-async-storage/async-storage` | Required by the Supabase client for session storage |

---

## Project Structure

```
mobile-journal-app/
├── App.js                        # Entry point, initializes the database
├── app.json                      # Expo config + permissions (camera/mic/storage)
├── package.json
├── supabase_setup.sql            # SQL to run in Supabase to create tables
├── src/
│   ├── database/
│   │   └── db.js                 # SQLite schema + all CRUD functions
│   ├── services/
│   │   └── supabase.js           # Cloud sync logic (upload/download)
│   ├── navigation/
│   │   └── AppNavigator.js       # Screen routing
│   ├── screens/
│   │   ├── HomeScreen.js         # Notes list
│   │   ├── CreateEditNoteScreen.js
│   │   ├── NoteDetailScreen.js
│   │   └── SettingsScreen.js
│   ├── components/
│   │   ├── AudioRecorder.js
│   │   ├── AudioPlayer.js
│   │   └── AttachmentPicker.js
│   └── utils/
│       └── uuid.js                # Simple unique ID generator
```

---

## Setup & Execution Instructions

### 1. Prerequisites
- Node.js (LTS version) installed
- The **Expo Go** app installed on your phone (Android/iOS), or an Android/iOS emulator
- A free [Supabase](https://supabase.com) account (only needed for the cloud sync feature)

### 2. Install dependencies
```bash
cd mobile-journal-app
npm install
```

### 3. Configure Supabase (optional — only needed for cloud sync)
1. Create a new project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in your Supabase project and run the contents of `supabase_setup.sql`.
3. Go to **Storage** → create a new bucket named exactly `media` and mark it **Public**.
4. Go to **Project Settings → API** and copy your **Project URL** and **anon public key**.
5. Open `src/services/supabase.js` and replace:
   ```js
   const SUPABASE_URL = 'https://YOUR-PROJECT-ID.supabase.co';
   const SUPABASE_ANON_KEY = 'YOUR-ANON-PUBLIC-KEY';
   ```
   with your actual values.

> If you skip this step, the app still works completely offline — the "Sync Now" button in Settings will simply fail gracefully with an error message.

### 4. Run the app
```bash
npx expo start
```
Scan the QR code with the **Expo Go** app on your phone (Android: use the Expo Go app's scanner; iOS: use the Camera app), or press `a` / `i` in the terminal to open an Android/iOS emulator.

### 5. Test it
- Tap **+** to create a note, write some text, tap **🎤 Record Audio**, then **Save**.
- Tap **📷 Camera** or **🖼 Gallery** to attach an image.
- Turn on Airplane Mode and confirm you can still create/view notes (offline test).
- Turn Wi-Fi back on, go to **Settings → Sync Now** to push data to Supabase.

---

## Permissions

The app requests the following permissions at runtime (not upfront), only when the relevant feature is used:
- **Microphone** — for recording audio notes
- **Camera** — for taking photos
- **Photo Library / Storage** — for selecting images and files

All permission requests include a user-facing explanation and gracefully handle denial (an alert is shown instead of crashing).

---

## Known Limitations

- The current sync implementation is "last write wins" — it does not handle merge conflicts if the same note is edited on two devices.
- Supabase Auth (login) is not implemented in this version — the `media` storage bucket is public, which is acceptable for this evaluation but not recommended for a production app.
- Audio files are stored in the `.m4a`/`.caf` format depending on platform default codecs.
