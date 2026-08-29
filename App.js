// =====================================================================
// App.js - Application Entry Point
// -----------------------------------------------------------------
// 1. Initializes the local SQLite database on app startup
// 2. Renders the navigation stack (Home / Create-Edit / Detail / Settings)
// =====================================================================

import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { initDatabase } from './src/database/db';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  const [dbReady, setDbReady] = useState(false);
  const [dbError, setDbError] = useState(null);

  useEffect(() => {
    try {
      initDatabase();
      setDbReady(true);
    } catch (err) {
      console.error('Database initialization failed', err);
      setDbError(err.message);
    }
  }, []);

  if (dbError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Failed to start the app.</Text>
        <Text style={styles.errorSubText}>{dbError}</Text>
      </View>
    );
  }

  if (!dbReady) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4A6FA5" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <AppNavigator />
    </>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  errorText: { fontSize: 16, fontWeight: '700', color: '#D9534F' },
  errorSubText: { fontSize: 13, color: '#888', marginTop: 8, textAlign: 'center' },
});
