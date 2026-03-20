// src/constants/ble.ts
// ✅ UUID đã xác nhận 100% từ nRF Connect

export const BLE_CONFIG = {
  // Lọc thiết bị theo tên
  DEVICE_NAME_KEYWORDS: ['UHF', 'RFID', 'ST-H103', 'H103', 'Hand Reader'],
  MAC_ADDRESS: 'E0:4E:7A:F3:78:56',

  // Service chính
  SERVICE_UUID:     '0000FFE0-0000-1000-8000-00805F9B34FB',

  // Characteristic để GỬI lệnh
  CHAR_WRITE_UUID:  '0000FFE3-0000-1000-8000-00805F9B34FB',

  // Characteristic phụ (config/settings)
  CHAR_CONFIG_UUID: '0000FFE1-0000-1000-8000-00805F9B34FB',

  // Characteristic để NHẬN data EPC
  CHAR_NOTIFY_UUID: '0000FFE4-0000-1000-8000-00805F9B34FB',

  // Characteristic để ĐỌC info
  CHAR_READ_UUID:   '0000FFE2-0000-1000-8000-00805F9B34FB',
  CHAR_INFO_UUID:   '0000FFE5-0000-1000-8000-00805F9B34FB',

  // Lệnh điều khiển
  COMMANDS: {
    // Multi-poll inventory: BB 00 27 00 03 22 FF FF checksum 7E  
    START_INVENTORY: [0xBB, 0x00, 0x27, 0x00, 0x03, 0x22, 0xFF, 0xFF, 0x4A, 0x7E],
    STOP_INVENTORY:  [0xBB, 0x00, 0x28, 0x00, 0x00, 0x28, 0x7E],
    
    // Single inventory (one shot): BB 00 22 00 00 22 7E
    SINGLE_INVENTORY: [0xBB, 0x00, 0x22, 0x00, 0x00, 0x22, 0x7E],
    
    // === Thay đổi Output Mode ===
    // BB 00 F1 00 01 [mode] [checksum] 7E
    // mode: 0x00=Serial, 0x01=BLE, 0x02=Keyboard/HID
    // checksum cho BLE mode: (00+F1+00+01+01) & 0xFF = F3
    SET_OUTPUT_BLE:      [0xBB, 0x00, 0xF1, 0x00, 0x01, 0x01, 0xF3, 0x7E],
    // checksum cho Keyboard: (00+F1+00+01+02) & 0xFF = F4
    SET_OUTPUT_KEYBOARD: [0xBB, 0x00, 0xF1, 0x00, 0x01, 0x02, 0xF4, 0x7E],
    
    // Query current settings: BB 00 F0 00 00 F0 7E
    GET_OUTPUT_MODE:     [0xBB, 0x00, 0xF0, 0x00, 0x00, 0xF0, 0x7E],
    
    // Get firmware version: BB 00 03 00 01 01 05 7E
    GET_VERSION:         [0xBB, 0x00, 0x03, 0x00, 0x01, 0x01, 0x05, 0x7E],
  }
};
