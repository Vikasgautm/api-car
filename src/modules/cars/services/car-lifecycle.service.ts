import { Car, EntityLifecycleState, EntityStatusHistoryEntry } from '../../../models/car.model';
import { CarVariant } from '../../../models/car-variant.model';
import { AppError } from '../../../shared/utils/app-error.util';
import { AuditActor } from '../../../shared/utils/audit.util';

export class CarLifecycleService {
  /**
   * Transition a car to a new lifecycle state
   * Preserves car_id, slug, and URL permanence
   * Automatically updates visibility and specs based on state
   */
  static async transitionState(
    carId: string,
    newState: EntityLifecycleState,
    actor: AuditActor,
    reason?: string
  ) {
    const car = await Car.findOne({ car_id: carId, is_deleted: false });
    if (!car) {
      throw new AppError('Car not found', 404);
    }

    const currentState = car.entity_lifecycle_state || 'launched';
    if (currentState === newState) {
      throw new AppError(`Car is already in ${newState} state`, 400);
    }

    // Create history entry
    const historyEntry: EntityStatusHistoryEntry = {
      state: newState,
      changed_at: new Date(),
      changed_by: actor.user_id || 'system',
      reason: reason || `Transitioned from ${currentState} to ${newState}`,
    };

    // Initialize history if doesn't exist
    if (!car.entity_status_history) {
      car.entity_status_history = [];
    }
    car.entity_status_history.push(historyEntry);

    // Update car state
    car.entity_lifecycle_state = newState;
    if (newState === 'launched') {
      car.entity_launch_date = new Date();
      car.is_upcoming = false;
      car.is_launched = true;
      car.status = 'launched';
      // Auto-unhide categories on launch
      await this.unHideCategoryOnLaunch(carId);
    } else if (newState === 'upcoming') {
      car.is_upcoming = true;
      car.is_launched = false;
      car.status = 'upcoming';
    } else if (newState === 'discontinued') {
      car.status = 'discontinued';
      car.discontinued_at = new Date();
      car.discontinued_by = actor.user_id || 'system';
    } else if (newState === 'facelift') {
      car.is_facelift = true;
      car.status = 'launched';
    }

    // Preserve entity creation time
    if (!car.entity_created_at) {
      car.entity_created_at = car.createdAt || new Date();
    }

    await car.save();
    return car;
  }

  /**
   * Auto-unhide categories and sections when car launches
   */
  static async unHideCategoryOnLaunch(carId: string) {
    const variants = await CarVariant.find({ car_id: carId, is_deleted: false });

    for (const variant of variants) {
      let modified = false;

      if (variant.hidden_sections && variant.hidden_sections.length > 0) {
        // Clear hidden sections on launch
        variant.hidden_sections = [];
        modified = true;
      }

      if (variant.section_visibility && variant.section_visibility.length > 0) {
        // Unhide teaser-only and partial sections
        variant.section_visibility = variant.section_visibility.map((section) => {
          if (section.visibility === 'teaser_only' || section.visibility === 'partial') {
            return { ...section, visibility: 'visible' as const, hidden_fields: [] };
          }
          return section;
        });
        modified = true;
      }

      if (variant.field_visibility) {
        // Unhide teaser_only and partial fields
        for (const [fieldKey, visibility] of Object.entries(variant.field_visibility)) {
          if (visibility === 'teaser_only' || visibility === 'partial') {
            variant.field_visibility[fieldKey] = 'visible';
            modified = true;
          }
        }
      }

      if (modified) {
        await variant.save();
      }
    }
  }

  /**
   * Get lifecycle history for a car
   */
  static async getHistory(carId: string) {
    const car = await Car.findOne({ car_id: carId, is_deleted: false });
    if (!car) {
      throw new AppError('Car not found', 404);
    }
    return {
      car_id: car.car_id,
      name: car.name,
      current_state: car.entity_lifecycle_state || 'launched',
      entity_created_at: car.entity_created_at,
      entity_launch_date: car.entity_launch_date,
      history: car.entity_status_history || [],
    };
  }

  /**
   * Schedule a lifecycle state change for future execution
   */
  static async scheduleStateChange(
    carId: string,
    newState: EntityLifecycleState,
    scheduledDate: Date,
    actor: AuditActor,
    reason?: string
  ) {
    const car = await Car.findOne({ car_id: carId, is_deleted: false });
    if (!car) {
      throw new AppError('Car not found', 404);
    }

    // Store scheduled transition in a metadata field
    if (!car.entity_status_history) {
      car.entity_status_history = [];
    }

    const scheduledEntry: EntityStatusHistoryEntry = {
      state: newState,
      changed_at: scheduledDate,
      changed_by: actor.user_id || 'system',
      reason: `[SCHEDULED] ${reason || `Scheduled for ${newState}`}`,
    };

    car.entity_status_history.push(scheduledEntry);
    await car.save();

    return {
      car_id: car.car_id,
      scheduled_state: newState,
      scheduled_date: scheduledDate,
      created_by: actor.user_id,
    };
  }

  /**
   * Get all upcoming cars scheduled to launch
   */
  static async getUpcomingLaunches(days: number = 30) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return await Car.find({
      is_deleted: false,
      entity_lifecycle_state: 'upcoming',
      entity_launch_date: {
        $gte: new Date(),
        $lte: futureDate,
      },
    })
      .select('car_id name brand_id entity_launch_date')
      .sort({ entity_launch_date: 1 });
  }

  /**
   * Track SEO metadata changes for history
   */
  static async recordSEOChange(
    carId: string,
    field: string,
    oldValue: any,
    newValue: any,
    actor: AuditActor
  ) {
    const car = await Car.findOne({ car_id: carId, is_deleted: false });
    if (!car) {
      throw new AppError('Car not found', 404);
    }

    if (!car.seo_history) {
      car.seo_history = [];
    }

    car.seo_history.push({
      field,
      old_value: oldValue,
      new_value: newValue,
      timestamp: new Date(),
      changed_by: actor.user_id || 'system',
    });

    await car.save();
  }

  /**
   * Track variant changes for history
   */
  static async recordVariantChange(
    carId: string,
    variantId: string,
    action: 'added' | 'removed' | 'visibility_changed' | 'specs_updated',
    actor: AuditActor,
    details?: Record<string, any>
  ) {
    const car = await Car.findOne({ car_id: carId, is_deleted: false });
    if (!car) {
      throw new AppError('Car not found', 404);
    }

    if (!car.variant_history) {
      car.variant_history = [];
    }

    car.variant_history.push({
      variant_id: variantId,
      action,
      timestamp: new Date(),
      changed_by: actor.user_id || 'system',
      details: details || {},
    });

    await car.save();
  }

  /**
   * Get SEO continuity report for a car (rankings, metadata evolution)
   */
  static async getSEOContinuityReport(carId: string) {
    const car = await Car.findOne({ car_id: carId, is_deleted: false });
    if (!car) {
      throw new AppError('Car not found', 404);
    }

    return {
      car_id: car.car_id,
      name: car.name,
      slug: car.slug, // Permanent and unchanging
      entity_lifecycle_state: car.entity_lifecycle_state || 'launched',
      canonical_url: car.canonical_url, // Permanent canonical
      url_permanence: {
        is_permanent: true,
        reason: 'URL structure remains unchanged through lifecycle transitions',
      },
      seo_metadata_evolution: car.seo_history || [],
      status_history: car.entity_status_history || [],
      variant_history: car.variant_history || [],
      seo_health: {
        meta_title_present: !!car.meta_title,
        meta_description_present: !!car.meta_description,
        canonical_url_present: !!car.canonical_url,
        noindex: car.noindex || false,
      },
    };
  }
}
