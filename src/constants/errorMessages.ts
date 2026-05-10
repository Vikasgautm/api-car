/**
 * Error Code Constants and User-Friendly Messages
 * Centralized location for all error codes and their corresponding user-facing messages
 */

export const ERROR_CODES = {
  // Resource Not Found Errors
  BRAND_NOT_FOUND: 'BRAND_NOT_FOUND',
  BODY_TYPE_NOT_FOUND: 'BODY_TYPE_NOT_FOUND',
  FUEL_TYPE_NOT_FOUND: 'FUEL_TYPE_NOT_FOUND',
  CAR_NOT_FOUND: 'CAR_NOT_FOUND',
  VARIANT_NOT_FOUND: 'VARIANT_NOT_FOUND',
  BLOG_NOT_FOUND: 'BLOG_NOT_FOUND',
  RECORD_NOT_FOUND: 'RECORD_NOT_FOUND',
  
  // Validation Errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  
  // Conflict Errors
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  
  // General Errors
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
} as const;

export const USER_MESSAGES = {
  BRAND_NOT_FOUND: 'Selected brand was not found. Please select a valid brand and try again.',
  BODY_TYPE_NOT_FOUND: 'Selected body type was not found. Please refresh the page and select a valid body type.',
  FUEL_TYPE_NOT_FOUND: 'Selected fuel type was not found. Please select a valid fuel type and try again.',
  CAR_NOT_FOUND: 'Car was not found. It may have been deleted or does not exist anymore.',
  VARIANT_NOT_FOUND: 'Variant was not found. It may have been deleted or does not exist anymore.',
  BLOG_NOT_FOUND: 'Blog was not found. It may have already been deleted.',
  VALIDATION_ERROR: 'Some required information is missing or invalid. Please check the form and try again.',
  RECORD_NOT_FOUND: 'Requested record was not found. Please refresh the page and try again.',
  INTERNAL_SERVER_ERROR: 'Something went wrong on the server. Please try again later.',
} as const;

export type ErrorCodeType = typeof ERROR_CODES[keyof typeof ERROR_CODES];
export type UserMessageType = typeof USER_MESSAGES[keyof typeof USER_MESSAGES];
