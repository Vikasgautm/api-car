/**
 * Error Code Constants and User-Friendly Messages
 * Centralized location for all error codes and their corresponding user-facing messages
 */
export declare const ERROR_CODES: {
    readonly BRAND_NOT_FOUND: "BRAND_NOT_FOUND";
    readonly BODY_TYPE_NOT_FOUND: "BODY_TYPE_NOT_FOUND";
    readonly FUEL_TYPE_NOT_FOUND: "FUEL_TYPE_NOT_FOUND";
    readonly CAR_NOT_FOUND: "CAR_NOT_FOUND";
    readonly VARIANT_NOT_FOUND: "VARIANT_NOT_FOUND";
    readonly BLOG_NOT_FOUND: "BLOG_NOT_FOUND";
    readonly RECORD_NOT_FOUND: "RECORD_NOT_FOUND";
    readonly VALIDATION_ERROR: "VALIDATION_ERROR";
    readonly ALREADY_EXISTS: "ALREADY_EXISTS";
    readonly INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR";
};
export declare const USER_MESSAGES: {
    readonly BRAND_NOT_FOUND: "Selected brand was not found. Please select a valid brand and try again.";
    readonly BODY_TYPE_NOT_FOUND: "Selected body type was not found. Please refresh the page and select a valid body type.";
    readonly FUEL_TYPE_NOT_FOUND: "Selected fuel type was not found. Please select a valid fuel type and try again.";
    readonly CAR_NOT_FOUND: "Car was not found. It may have been deleted or does not exist anymore.";
    readonly VARIANT_NOT_FOUND: "Variant was not found. It may have been deleted or does not exist anymore.";
    readonly BLOG_NOT_FOUND: "Blog was not found. It may have already been deleted.";
    readonly VALIDATION_ERROR: "Some required information is missing or invalid. Please check the form and try again.";
    readonly RECORD_NOT_FOUND: "Requested record was not found. Please refresh the page and try again.";
    readonly INTERNAL_SERVER_ERROR: "Something went wrong on the server. Please try again later.";
};
export type ErrorCodeType = typeof ERROR_CODES[keyof typeof ERROR_CODES];
export type UserMessageType = typeof USER_MESSAGES[keyof typeof USER_MESSAGES];
