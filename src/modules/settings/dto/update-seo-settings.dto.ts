import { ValidationUtil } from '../../../shared/utils/validation.util';

export interface UpdateSEOSettingsDto {
  site_title?: string;
  site_description?: string;
  site_keywords?: string;
  og_default_image?: string;
  twitter_handle?: string;
  google_analytics_id?: string;
  google_tag_manager_id?: string;
  facebook_pixel_id?: string;
}

export class UpdateSEOSettingsDto {
  static validate(data: UpdateSEOSettingsDto): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate site_title if provided
    if (data.site_title !== undefined) {
      const requiredResult = ValidationUtil.required(data.site_title, 'site_title');
      if (!requiredResult.valid) {
        errors.push(...requiredResult.errors);
      } else {
        const minLengthResult = ValidationUtil.minLength(data.site_title, 3, 'site_title');
        if (!minLengthResult.valid) {
          errors.push(...minLengthResult.errors);
        }
        const maxLengthResult = ValidationUtil.maxLength(data.site_title, 100, 'site_title');
        if (!maxLengthResult.valid) {
          errors.push(...maxLengthResult.errors);
        }
      }
    }

    // Validate site_description if provided
    if (data.site_description !== undefined) {
      const requiredResult = ValidationUtil.required(data.site_description, 'site_description');
      if (!requiredResult.valid) {
        errors.push(...requiredResult.errors);
      } else {
        const minLengthResult = ValidationUtil.minLength(data.site_description, 10, 'site_description');
        if (!minLengthResult.valid) {
          errors.push(...minLengthResult.errors);
        }
        const maxLengthResult = ValidationUtil.maxLength(data.site_description, 500, 'site_description');
        if (!maxLengthResult.valid) {
          errors.push(...maxLengthResult.errors);
        }
      }
    }

    // Validate site_keywords if provided
    if (data.site_keywords !== undefined && data.site_keywords !== '') {
      const maxLengthResult = ValidationUtil.maxLength(data.site_keywords, 500, 'site_keywords');
      if (!maxLengthResult.valid) {
        errors.push(...maxLengthResult.errors);
      }
    }

    // Validate og_default_image if provided
    if (data.og_default_image !== undefined && data.og_default_image !== '') {
      const urlResult = ValidationUtil.url(data.og_default_image);
      if (!urlResult.valid) {
        errors.push(...urlResult.errors);
      }
    }

    // Validate twitter_handle if provided
    if (data.twitter_handle !== undefined && data.twitter_handle !== '') {
      const maxLengthResult = ValidationUtil.maxLength(data.twitter_handle, 50, 'twitter_handle');
      if (!maxLengthResult.valid) {
        errors.push(...maxLengthResult.errors);
      }
      // Twitter handle should start with @
      if (!data.twitter_handle.startsWith('@')) {
        errors.push('twitter_handle must start with @');
      }
    }

    // Validate google_analytics_id if provided
    if (data.google_analytics_id !== undefined && data.google_analytics_id !== '') {
      const maxLengthResult = ValidationUtil.maxLength(data.google_analytics_id, 50, 'google_analytics_id');
      if (!maxLengthResult.valid) {
        errors.push(...maxLengthResult.errors);
      }
      // GA ID format: G-XXXXXXXXXX or UA-XXXXXXXX-X
      const gaPattern = /^(G-[A-Z0-9]{10}|UA-\d{4,10}-\d{1,4})$/;
      if (!gaPattern.test(data.google_analytics_id)) {
        errors.push('google_analytics_id must be in format G-XXXXXXXXXX or UA-XXXXXXXX-X');
      }
    }

    // Validate google_tag_manager_id if provided
    if (data.google_tag_manager_id !== undefined && data.google_tag_manager_id !== '') {
      const maxLengthResult = ValidationUtil.maxLength(data.google_tag_manager_id, 50, 'google_tag_manager_id');
      if (!maxLengthResult.valid) {
        errors.push(...maxLengthResult.errors);
      }
      // GTM ID format: GTM-XXXXXXX
      const gtmPattern = /^GTM-[A-Z0-9]{7}$/;
      if (!gtmPattern.test(data.google_tag_manager_id)) {
        errors.push('google_tag_manager_id must be in format GTM-XXXXXXX');
      }
    }

    // Validate facebook_pixel_id if provided
    if (data.facebook_pixel_id !== undefined && data.facebook_pixel_id !== '') {
      const maxLengthResult = ValidationUtil.maxLength(data.facebook_pixel_id, 50, 'facebook_pixel_id');
      if (!maxLengthResult.valid) {
        errors.push(...maxLengthResult.errors);
      }
      // Pixel ID should be numeric
      const numericPattern = /^\d+$/;
      if (!numericPattern.test(data.facebook_pixel_id)) {
        errors.push('facebook_pixel_id must be numeric');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
