import { Request, Response } from 'express';
import { DashboardActivityService } from '../services/dashboard-activity.service';
import { DashboardComparisonService } from '../services/dashboard-comparison.service';
import { DashboardFuelService } from '../services/dashboard-fuel.service';
import { DashboardHealthService } from '../services/dashboard-health.service';
import { DashboardImportService } from '../services/dashboard-import.service';
import { DashboardOverviewService } from '../services/dashboard-overview.service';
import { DashboardPriorityService } from '../services/dashboard-priority.service';
import { DashboardSearchService } from '../services/dashboard-search.service';
import { DashboardSeoService } from '../services/dashboard-seo.service';

export class DashboardController {
  static async getOverview(req: Request, res: Response): Promise<void> {
    try {
      const data = await DashboardOverviewService.getOverview();
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async getPriorities(req: Request, res: Response): Promise<void> {
    try {
      const data = await DashboardPriorityService.getPriorities();
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async getContentHealth(req: Request, res: Response): Promise<void> {
    try {
      const data = await DashboardHealthService.getSummary();
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async getRecentActivity(req: Request, res: Response): Promise<void> {
    try {
      const limit = Math.min(Number(req.query.limit) || 20, 50);
      const data = await DashboardActivityService.getRecentActivity(limit);
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async getSeoSummary(req: Request, res: Response): Promise<void> {
    try {
      const data = await DashboardSeoService.getSummary();
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async getImportHealth(req: Request, res: Response): Promise<void> {
    try {
      const data = await DashboardImportService.getSummary();
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async getFuelSummary(req: Request, res: Response): Promise<void> {
    try {
      const data = await DashboardFuelService.getSnapshot();
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async getComparisonSummary(req: Request, res: Response): Promise<void> {
    try {
      const data = await DashboardComparisonService.getSummary();
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async globalSearch(req: Request, res: Response): Promise<void> {
    try {
      const q = String(req.query.q || '').trim();
      const data = await DashboardSearchService.search(q);
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}
