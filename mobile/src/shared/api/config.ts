import Constants from 'expo-constants';

// Lấy IP của máy chủ Expo (dùng thay cho localhost trên mobile ở môi trường dev)
const debuggerHost = Constants.expoConfig?.hostUri;
const localhost = debuggerHost ? debuggerHost.split(':')[0] : 'localhost';

const LOCAL_API = `http://${localhost}:3000/api`;
const PROD_API = 'https://rfid-backend-gy05.onrender.com/api';

// Nếu đang built APK (production) sẽ dùng PROD_API, còn chạy Expo Go sẽ dùng LOCAL_API.
export const API_URL = __DEV__ ? LOCAL_API : PROD_API;
