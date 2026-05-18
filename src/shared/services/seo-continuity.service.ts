import { Car } from '../../models/car.model';
import { Redirect } from '../../models/redirect.model';
import { AppError } from '../utils/app-error.util';

export class SEOContinuityService {
  /**
   * Validate that a car's URL will remain permanent during lifecycle transitions
   */
  static validateURLPermanence(car: any): { valid: boolean; warnings: string[] } {
    const warnings: string[] = [];

    // Warn if slug looks generated (could be fragile)
    if (car.slug && car.slug.includes('--')) {
      warnings.push('Slug contains double hyphens, verify it was manually set');
    }

    // Warn if no canonical URL set
    if (!car.canonical_url) {
      warnings.push('No canonical URL set; recommend setting it explicitly for SEO continuity');
    }

    // Warn if redirect_to_slug is set (indicates previous transition)
    if (car.redirect_to_slug && car.redirect_to_slug !== car.slug) {
      warnings.push(
        `This car has been renamed before: ${car.redirect_to_slug} → ${car.slug}. Be careful not to break existing backlinks.`
      );
    }

    return {
      valid: true,
      warnings,
    };
  }

  /**
   * Prevent URL changes during lifecycle transition
   */
  static preventURLChangeOnTransition(
    currentSlug: string,
    newSlug: string,
    carId: string
  ): { allowed: boolean; error?: string } {
    // Slug must NEVER change during lifecycle transition
    if (currentSlug !== newSlug) {
      return {
        allowed: false,
        error: `URL slug cannot change during lifecycle transition. Current: /cars/${currentSlug}, attempted: /cars/${newSlug}. Lifecycle changes must preserve existing URLs.`,
      };
    }

    return { allowed: true };
  }

  /**
   * Ensure canonical URL is set and won't change
   */
  static async validateCanonicalURL(carId: string): Promise<{
    has_canonical: boolean;
    canonical_url?: string;
    warning?: string;
  }> {
    const car = await Car.findOne({ car_id: carId, is_deleted: false });
    if (!car) {
      throw new AppError('Car not found', 404);
    }

    if (!car.canonical_url) {
      return {
        has_canonical: false,
        warning: `No canonical URL set for ${car.name}. Recommend setting it to: https://carsalahakar.com/cars/${car.slug}`,
      };
    }

    return {
      has_canonical: true,
      canonical_url: car.canonical_url,
    };
  }

  /**
   * Create protective redirects for URL permanence
   * When a car transitions, ensure old variants/URLs still resolve
   */
  static async createProtectiveRedirects(carId: string, actor: any) {
    const car = await Car.findOne({ car_id: carId, is_deleted: false });
    if (!car) {
      throw new AppError('Car not found', 404);
    }

    const baseUrl = `/cars/${car.slug}`;

    // Check if redirect already exists
    const existingRedirect = await Redirect.findOne({
      old_url: baseUrl,
      is_deleted: false,
    });

    if (existingRedirect) {
      return existingRedirect; // Already protected
    }

    // Create permanent redirect in case something changes
    const redirect = await Redirect.create({
      redirect_id: `redir_${Date.now()}`,
      old_url: baseUrl,
      new_url: baseUrl,
      type: '301', // Permanent redirect
      is_deleted: false,
      created_by: actor.user_id || 'system',
    });

    return redirect;
  }

  /**
   * Track metadata changes for SEO history
   */
  static async trackMetadataChange(
    carId: string,
    field: string,
    oldValue: any,
    newValue: any,
    actor: any
  ) {
    const car = await Car.findOne({ car_id: carId, is_deleted: false });
    if (!car) {
      throw new AppError('Car not found', 404);
    }

    if (!car.seo_history) {
      car.seo_history = [];
    }

    // Only track if value actually changed
    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      car.seo_history.push({
        field,
        old_value: oldValue,
        new_value: newValue,
        timestamp: new Date(),
        changed_by: actor.user_id || 'system',
      });

      await car.save();
    }
  }

  /**
   * Generate SEO-optimized meta title for state
   */
  static generateMetaTitleForState(carName: string, state: string): string {
    switch (state) {
      case 'upcoming':
        return `${carName} - Expected Launch | CarSalahakar`;
      case 'launched':
        return `${carName} - Price, Specs & Reviews | CarSalahakar`;
      case 'discontinued':
        return `${carName} - Discontinued | CarSalahakar`;
      case 'facelift':
        return `${carName} Facelift - New Features | CarSalahakar`;
      default:
        return `${carName} | CarSalahakar`;
    }
  }

  /**
   * Generate SEO-optimized meta description for state
   */
  static generateMetaDescriptionForState(
    carName: string,
    state: string,
    launchDate?: Date
  ): string {
    const launchStr = launchDate ? new Date(launchDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' }) : 'soon';

    switch (state) {
      case 'upcoming':
        return `Upcoming ${carName} - Expected launch ${launchStr}. Check expected price, specifications, and launch updates.`;
      case 'launched':
        return `${carName} - Check on-road price, mileage, specifications, and expert reviews on CarSalahakar.`;
      case 'discontinued':
        return `${carName} - No longer available. View specifications and compare with alternatives on CarSalahakar.`;
      case 'facelift':
        return `${carName} Facelift - New features and improvements. Compare with previous generation.`;
      default:
        return `${carName} car information, specifications, and reviews on CarSalahakar.`;
    }
  }

  /**
   * Validate SEO health before major transitions
   */
  static async validateSEOHealthBeforeTransition(carId: string): Promise<{
    healthy: boolean;
    issues: string[];
  }> {
    const car = await Car.findOne({ car_id: carId, is_deleted: false });
    if (!car) {
      throw new AppError('Car not found', 404);
    }

    const issues: string[] = [];

    // Check required SEO fields
    if (!car.meta_title) {
      issues.push('Meta title not set');
    }
    if (!car.meta_description) {
      issues.push('Meta description not set');
    }
    if (!car.canonical_url) {
      issues.push('Canonical URL not set');
    }
    if (car.noindex) {
      issues.push('Page is marked as noindex');
    }

    // Check that slug hasn't changed unexpectedly
    if (!car.slug) {
      issues.push('Slug is missing');
    }

    return {
      healthy: issues.length === 0,
      issues,
    };
  }
}
