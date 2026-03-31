import Constants from 'expo-constants';

// Lấy IP của máy chủ Expo (dùng thay cho localhost trên mobile)
const debuggerHost = Constants.expoConfig?.hostUri;
const localhost = debuggerHost ? debuggerHost.split(':')[0] : 'localhost';

const LOCAL_API = `http://${localhost}:3000/api`;
export const API_URL = process.env.EXPO_PUBLIC_API_URL || LOCAL_API;
