// =====================================================================
// AttachmentPicker.js - Capture/select images and pick files from storage
// -----------------------------------------------------------------
// Covers assignment section 4.3 (Attachments):
//   - Select or capture images (camera + gallery)
//   - Pick files from device storage
// =====================================================================

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';

// Attachments are copied into the app's permanent document directory so
// they survive even if the original gallery/file location changes.
const ATTACHMENTS_DIR = FileSystem.documentDirectory + 'attachments/';

async function ensureDirExists() {
  const dirInfo = await FileSystem.getInfoAsync(ATTACHMENTS_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(ATTACHMENTS_DIR, { intermediates: true });
  }
}

async function copyToLocalStorage(sourceUri, fileName) {
  await ensureDirExists();
  const destUri = ATTACHMENTS_DIR + fileName;
  await FileSystem.copyAsync({ from: sourceUri, to: destUri });
  return destUri;
}

export default function AttachmentPicker({ onImageAdded, onFileAdded }) {
  // -------------------------------------------------------------
  // TAKE PHOTO WITH CAMERA
  // -------------------------------------------------------------
  async function takePhoto() {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Camera Permission Needed', 'Please allow camera access to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.7,
        base64: false,
      });

      if (!result.canceled && result.assets?.length > 0) {
        const asset = result.assets[0];
        const fileName = `photo_${Date.now()}.jpg`;
        const localUri = await copyToLocalStorage(asset.uri, fileName);
        onImageAdded(localUri, fileName);
      }
    } catch (err) {
      console.error('Camera error', err);
      Alert.alert('Camera Error', 'Could not capture photo.');
    }
  }

  // -------------------------------------------------------------
  // PICK IMAGE FROM GALLERY
  // -------------------------------------------------------------
  async function pickImage() {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Photos Permission Needed', 'Please allow photo library access.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
      });

      if (!result.canceled && result.assets?.length > 0) {
        const asset = result.assets[0];
        const fileName = `image_${Date.now()}.jpg`;
        const localUri = await copyToLocalStorage(asset.uri, fileName);
        onImageAdded(localUri, fileName);
      }
    } catch (err) {
      console.error('Image picker error', err);
      Alert.alert('Error', 'Could not select image.');
    }
  }

  // -------------------------------------------------------------
  // PICK ANY FILE FROM DEVICE STORAGE
  // -------------------------------------------------------------
  async function pickFile() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets?.length > 0) {
        const asset = result.assets[0];
        const fileName = asset.name || `file_${Date.now()}`;
        const localUri = await copyToLocalStorage(asset.uri, fileName);
        onFileAdded(localUri, fileName);
      }
    } catch (err) {
      console.error('Document picker error', err);
      Alert.alert('Error', 'Could not select file.');
    }
  }

  return (
    <View style={styles.row}>
      <TouchableOpacity style={styles.button} onPress={takePhoto}>
        <Text style={styles.buttonText}>📷 Camera</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={pickImage}>
        <Text style={styles.buttonText}>🖼 Gallery</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={pickFile}>
        <Text style={styles.buttonText}>📎 File</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 8 },
  button: {
    flex: 1,
    backgroundColor: '#6C8EBF',
    paddingVertical: 10,
    borderRadius: 10,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 13 },
});
