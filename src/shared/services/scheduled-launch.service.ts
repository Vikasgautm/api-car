import { Car, EntityLifecycleState } from '../../models/car.model';
import { CarVariant } from '../../models/car-variant.model';
import { CarLifecycleService } from '../../modules/cars/services/car-lifecycle.service';
import { VariantLifecycleService } from '../../modules/variants/services/variant-lifecycle.service';

interface ScheduledTransition {
  carId: string;
  targetState: EntityLifecycleState;
  scheduledDate: Date;
  reason?: string;
}

export class ScheduledLaunchService {
  /**
   * Process all scheduled launches that are due
   * Called by cron job or background task
   */
  static async processScheduledLaunches() {
    const now = new Date();

    // Find all cars with scheduled transitions
    const cars = await Car.find({
      'entity_status_history': {
        $elemMatch: {
          reason: { $regex: '^\\[SCHEDULED\\]' },
          changed_at: { $lte: now },
        },
      },
      is_deleted: false,
    });

    const results = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const car of cars) {
      try {
        // Find the scheduled entry
        const scheduledEntry = car.entity_status_history?.find(
          (h) =>
            h.reason?.startsWith('[SCHEDULED]') && h.changed_at <= now
        );

        if (!scheduledEntry) continue;

        // Execute the transition
        await CarLifecycleService.transitionState(
          car.car_id,
          scheduledEntry.state,
          { user_id: 'system' },
          `Auto-executed scheduled transition: ${scheduledEntry.reason}`
        );

        results.succeeded++;
      } catch (error) {
        results.failed++;
        results.errors.push(
          `Failed to process car ${car.car_id}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
      results.processed++;
    }

    return results;
  }

  /**
   * Perform bulk category evolution when a car launches
   * Unhides all variant sections and enables SEO filters
   */
  static async performBulkCategoryEvolutionOnLaunch(carId: string) {
    const car = await Car.findOne({ car_id: carId, is_deleted: false });
    if (!car) {
      throw new Error(`Car ${carId} not found`);
    }

    const variants = await CarVariant.find({ car_id: carId, is_deleted: false });

    const results = {
      total_variants: variants.length,
      unhidden: 0,
      enabled_seo_filters: 0,
      errors: [] as string[],
    };

    for (const variant of variants) {
      try {
        // Unhide all sections
        await VariantLifecycleService.unhideAllSections(variant.variant_id);

        // Update market status
        variant.market_status = 'available';
        variant.is_upcoming = false;
        await variant.save();

        results.unhidden++;
      } catch (error) {
        results.errors.push(
          `Failed to evolve variant ${variant.variant_id}: ${error instanceof Error ? error.message : 'Unknown'}`
        );
      }
    }

    // Enable SEO filters on car
    const aggregatedFeatures = {
      sunroof_available: car.sunroof_available,
      adas_available: car.adas_available,
      ventilated_seats_available: car.ventilated_seats_available,
      camera_360_available: car.camera_360_available,
      connected_car_available: car.connected_car_available,
      wireless_charger_available: car.wireless_charger_available,
      air_purifier_available: car.air_purifier_available,
      panoramic_sunroof_available: car.panoramic_sunroof_available,
    };

    // All features that were previously only teaser are now visible in SEO
    results.enabled_seo_filters = Object.values(aggregatedFeatures).filter(Boolean).length;

    return results;
  }

  /**
   * Schedule a future state transition
   */
  static async scheduleLaunchTransition(
    carId: string,
    targetState: EntityLifecycleState,
    scheduledDate: Date,
    reason?: string
  ): Promise<ScheduledTransition> {
    const car = await Car.findOne({ car_id: carId, is_deleted: false });
    if (!car) {
      throw new Error(`Car ${carId} not found`);
    }

    if (scheduledDate <= new Date()) {
      throw new Error('Scheduled date must be in the future');
    }

    // Add to history as [SCHEDULED]
    if (!car.entity_status_history) {
      car.entity_status_history = [];
    }

    car.entity_status_history.push({
      state: targetState,
      changed_at: scheduledDate,
      changed_by: 'system',
      reason: `[SCHEDULED] ${reason || `Scheduled transition to ${targetState}`}`,
    });

    await car.save();

    return {
      carId,
      targetState,
      scheduledDate,
      reason,
    };
  }

  /**
   * Get all scheduled launches for a date range
   */
  static async getScheduledLaunchesInRange(
    startDate: Date,
    endDate: Date
  ) {
    return await Car.find({
      'entity_status_history': {
        $elemMatch: {
          reason: { $regex: '^\\[SCHEDULED\\]' },
          changed_at: {
            $gte: startDate,
            $lte: endDate,
          },
        },
      },
      is_deleted: false,
    })
      .select('car_id name entity_status_history')
      .sort({ 'entity_status_history.changed_at': 1 });
  }

  /**
   * Cancel a scheduled launch
   */
  static async cancelScheduledLaunch(carId: string, targetState: EntityLifecycleState) {
    const car = await Car.findOne({ car_id: carId, is_deleted: false });
    if (!car) {
      throw new Error(`Car ${carId} not found`);
    }

    if (!car.entity_status_history) {
      throw new Error('No scheduled launches found');
    }

    // Remove scheduled entry
    car.entity_status_history = car.entity_status_history.filter(
      (h) => !(h.reason?.startsWith('[SCHEDULED]') && h.state === targetState)
    );

    await car.save();

    return { success: true, message: 'Scheduled launch cancelled' };
  }

  /**
   * Get upcoming launches in the next N days
   */
  static async getUpcomingLaunchesWindow(days: number = 30) {
    const today = new Date();
    const future = new Date();
    future.setDate(future.getDate() + days);

    const scheduled = await this.getScheduledLaunchesInRange(today, future);

    return scheduled.map((car) => {
      const scheduledEntry = car.entity_status_history?.find((h) =>
        h.reason?.startsWith('[SCHEDULED]')
      );

      return {
        car_id: car.car_id,
        name: car.name,
        scheduled_date: scheduledEntry?.changed_at,
        target_state: scheduledEntry?.state,
        reason: scheduledEntry?.reason,
      };
    });
  }
}
