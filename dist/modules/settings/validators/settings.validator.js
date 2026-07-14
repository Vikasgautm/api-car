"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateSettingsData = validateSettingsData;
function isValidUrl(v) {
    if (!v)
        return true;
    try {
        new URL(v);
        return true;
    }
    catch {
        return false;
    }
}
function isValidEmail(v) {
    return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}
function isValidPhone(v) {
    return !v || /^[\+]?[\d\s\-()]{7,20}$/.test(v);
}
const GROUP_VALIDATORS = {
    general: (data) => {
        const errors = [];
        if (data.canonical_domain && !isValidUrl(data.canonical_domain))
            errors.push('canonical_domain must be a valid URL');
        if (data.contact_email && !isValidEmail(data.contact_email))
            errors.push('contact_email must be a valid email');
        if (data.support_phone && !isValidPhone(data.support_phone))
            errors.push('support_phone must be a valid phone number');
        if (data.default_og_image && !isValidUrl(data.default_og_image))
            errors.push('default_og_image must be a valid URL');
        if (data.social_facebook && !isValidUrl(data.social_facebook))
            errors.push('social_facebook must be a valid URL');
        if (data.social_twitter && !isValidUrl(data.social_twitter))
            errors.push('social_twitter must be a valid URL');
        if (data.social_instagram && !isValidUrl(data.social_instagram))
            errors.push('social_instagram must be a valid URL');
        if (data.social_youtube && !isValidUrl(data.social_youtube))
            errors.push('social_youtube must be a valid URL');
        return errors;
    },
    seo: (data) => {
        const errors = [];
        if (data.auto_noindex_threshold !== undefined && (data.auto_noindex_threshold < 0 || data.auto_noindex_threshold > 100))
            errors.push('auto_noindex_threshold must be between 0 and 100');
        if (data.min_cars_to_index !== undefined && data.min_cars_to_index < 0)
            errors.push('min_cars_to_index must be >= 0');
        if (data.duplicate_risk_threshold !== undefined && (data.duplicate_risk_threshold < 0 || data.duplicate_risk_threshold > 100))
            errors.push('duplicate_risk_threshold must be between 0 and 100');
        if (data.min_health_score !== undefined && (data.min_health_score < 0 || data.min_health_score > 100))
            errors.push('min_health_score must be between 0 and 100');
        if (data.default_redirect_type !== undefined && ![301, 302].includes(data.default_redirect_type))
            errors.push('default_redirect_type must be 301 or 302');
        if (data.google_analytics_id && !/^(G-[A-Z0-9]{10}|UA-\d{4,10}-\d{1,4})$/.test(data.google_analytics_id))
            errors.push('google_analytics_id must be in format G-XXXXXXXXXX or UA-XXXXXXXX-X');
        if (data.google_tag_manager_id && !/^GTM-[A-Z0-9]{7}$/.test(data.google_tag_manager_id))
            errors.push('google_tag_manager_id must be in format GTM-XXXXXXX');
        if (data.facebook_pixel_id && !/^\d+$/.test(data.facebook_pixel_id))
            errors.push('facebook_pixel_id must be numeric');
        return errors;
    },
    imports: (data) => {
        const errors = [];
        if (data.request_timeout_ms !== undefined && data.request_timeout_ms < 1000)
            errors.push('request_timeout_ms must be at least 1000');
        if (data.retry_count !== undefined && (data.retry_count < 0 || data.retry_count > 10))
            errors.push('retry_count must be between 0 and 10');
        if (data.min_confidence_to_save !== undefined && (data.min_confidence_to_save < 0 || data.min_confidence_to_save > 100))
            errors.push('min_confidence_to_save must be between 0 and 100');
        if (data.min_confidence_to_publish !== undefined && (data.min_confidence_to_publish < 0 || data.min_confidence_to_publish > 100))
            errors.push('min_confidence_to_publish must be between 0 and 100');
        if (data.concurrent_import_limit !== undefined && (data.concurrent_import_limit < 1 || data.concurrent_import_limit > 20))
            errors.push('concurrent_import_limit must be between 1 and 20');
        return errors;
    },
    ai_intelligence: (data) => {
        const errors = [];
        if (data.llm_confidence_threshold !== undefined && (data.llm_confidence_threshold < 0 || data.llm_confidence_threshold > 100))
            errors.push('llm_confidence_threshold must be between 0 and 100');
        if (data.max_retry_count !== undefined && (data.max_retry_count < 0 || data.max_retry_count > 5))
            errors.push('max_retry_count must be between 0 and 5');
        if (data.ai_timeout_ms !== undefined && data.ai_timeout_ms < 5000)
            errors.push('ai_timeout_ms must be at least 5000');
        if (data.daily_token_limit !== undefined && data.daily_token_limit < 0)
            errors.push('daily_token_limit must be >= 0');
        return errors;
    },
    performance: (data) => {
        const errors = [];
        if (data.discovery_cache_ttl_ms !== undefined && data.discovery_cache_ttl_ms < 0)
            errors.push('discovery_cache_ttl_ms must be >= 0');
        if (data.max_admin_page_size !== undefined && (data.max_admin_page_size < 1 || data.max_admin_page_size > 500))
            errors.push('max_admin_page_size must be between 1 and 500');
        if (data.public_api_rate_limit !== undefined && data.public_api_rate_limit < 0)
            errors.push('public_api_rate_limit must be >= 0');
        return errors;
    },
    security: (data) => {
        const errors = [];
        if (data.otp_expiry_minutes !== undefined && (data.otp_expiry_minutes < 1 || data.otp_expiry_minutes > 60))
            errors.push('otp_expiry_minutes must be between 1 and 60');
        if (data.max_login_attempts !== undefined && (data.max_login_attempts < 1 || data.max_login_attempts > 20))
            errors.push('max_login_attempts must be between 1 and 20');
        if (data.brute_force_lock_duration_minutes !== undefined && data.brute_force_lock_duration_minutes < 1)
            errors.push('brute_force_lock_duration_minutes must be >= 1');
        return errors;
    },
    audit_logs: (data) => {
        const errors = [];
        if (data.audit_retention_days !== undefined && (data.audit_retention_days < 7 || data.audit_retention_days > 3650))
            errors.push('audit_retention_days must be between 7 and 3650');
        if (data.log_verbosity !== undefined && !['minimal', 'standard', 'verbose'].includes(data.log_verbosity))
            errors.push('log_verbosity must be minimal, standard, or verbose');
        return errors;
    },
};
function validateSettingsData(group, data) {
    const validator = GROUP_VALIDATORS[group];
    if (!validator)
        return { valid: true, errors: [] };
    const errors = validator(data);
    return { valid: errors.length === 0, errors };
}
