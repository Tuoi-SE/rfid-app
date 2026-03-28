// Environment configuration

// Ideally, this should come from process.env or react-native-dotenv
// For now, keeping the fallback as was in SyncService.ts
// Use your machine's LOCAL IP if testing on a physical device.
// Use 'localhost' or '127.0.0.1' for iOS Simulator. 
export const API_URL = 'http://192.168.1.12:3000/api'; 
// export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';
