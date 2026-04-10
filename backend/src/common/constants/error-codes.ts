/**
 * Shared magic-string constants extracted from services (D-09).
 * Centralizing these improves refactoring safety and IDE support.
 */

// Device types for session management
export const DEVICE_TYPES = {
  WEB: 'WEB',
  MOBILE: 'MOBILE',
} as const;

// Transfer code prefix for unique code generation
export const TRANSFER_CODE_PREFIX = 'TRF-';

// Tag event types for audit log
export const TAG_EVENT_TYPES = {
  RECALLED: 'RECALLED',
} as const;

// Tag condition values
export const TAG_CONDITIONS = {
  GOOD: 'GOOD',
} as const;

// Transfer error codes for consistent BusinessException responses (D-01)
export const TRANSFER_ERROR_CODES = {
  SOURCE_NOT_FOUND: 'TRANSFER_SOURCE_NOT_FOUND',
  DEST_NOT_FOUND: 'TRANSFER_DEST_NOT_FOUND',
  NOT_FOUND: 'TRANSFER_NOT_FOUND',
  INVALID_TYPE: 'TRANSFER_INVALID_TYPE',
  INVALID_REQUEST: 'TRANSFER_INVALID_REQUEST',
  ACCESS_DENIED: 'TRANSFER_ACCESS_DENIED',
  INVALID_STATUS: 'TRANSFER_INVALID_STATUS',
  TAG_VALIDATION_FAILED: 'TRANSFER_TAG_VALIDATION_FAILED',
  TAG_ALREADY_IN_TRANSFER: 'TRANSFER_TAG_ALREADY_IN_TRANSFER',
} as const;

// Auth error codes for email-based authentication
export const AUTH_ERROR_CODES = {
  EMAIL_NOT_FOUND: 'AUTH_EMAIL_NOT_FOUND',
  INVALID_RESET_TOKEN: 'AUTH_INVALID_RESET_TOKEN',
  RESET_TOKEN_EXPIRED: 'AUTH_RESET_TOKEN_EXPIRED',
  RESET_TOKEN_USED: 'AUTH_RESET_TOKEN_USED',
  EMAIL_ALREADY_EXISTS: 'AUTH_EMAIL_ALREADY_EXISTS',
  EMAIL_NOT_VERIFIED: 'AUTH_EMAIL_NOT_VERIFIED',
  INVALID_VERIFICATION_TOKEN: 'AUTH_INVALID_VERIFICATION_TOKEN',
  VERIFICATION_TOKEN_EXPIRED: 'AUTH_VERIFICATION_TOKEN_EXPIRED',
  PASSWORD_CHANGE_REQUIRED: 'AUTH_PASSWORD_CHANGE_REQUIRED',
} as const;
