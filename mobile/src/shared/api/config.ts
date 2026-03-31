// Luôn dùng localhost vì đã setup: adb reverse tcp:3000 tcp:3000
// Lệnh này forward localhost:3000 trên điện thoại -> localhost:3000 trên máy tính
// Hoạt động cho cả emulator lẫn thiết bị thật qua USB
const LOCAL_API = 'http://localhost:3000/api';
export const API_URL = process.env.EXPO_PUBLIC_API_URL || LOCAL_API;
