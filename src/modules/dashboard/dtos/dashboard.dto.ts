export interface DashboardOverview {
  cars: {
    total: number;
    published: number;
    draft: number;
    upcoming: number;
    archived: number;
    discontinued: number;
  };
  total_variants: number;
  total_seo_collections: number;
  failed_imports: number;
  pending_ai_refinements: number;
  content_health_issues: number;
}

export interface PriorityItem {
  id: string;
  title: string;
  description: string;
  count: number;
  severity: 'critical' | 'warning' | 'info';
  redirect_link: string;
  action_label: string;
}

export interface DashboardPriorities {
  items: PriorityItem[];
  total_issues: number;
  critical_count: number;
  warning_count: number;
}

export interface ContentHealthSummary {
  missing_images: number;
  missing_seo: number;
  broken_slugs: number;
  orphan_variants: number;
  stale_lifecycle: number;
  low_confidence_specs: number;
  duplicate_slugs: number;
  total_issues: number;
}

export interface ActivityItem {
  activity_id: string;
  title: string;
  entity_type: string;
  entity_id: string;
  action: string;
  actor_email?: string | null;
  timestamp: Date;
}

export interface DashboardRecentActivity {
  items: ActivityItem[];
}

export interface SeoSummary {
  total: number;
  published: number;
  draft: number;
  archived: number;
  weak: number;
  empty: number;
}

export interface RecentFailedImport {
  import_id: string;
  source: string;
  source_url: string;
  error_messages: string[];
  created_at: Date;
}

export interface ImportHealthSummary {
  imports_today: number;
  failed_imports: number;
  saved_imports: number;
  low_confidence_imports: number;
  unmapped_key_count: number;
  recent_failed: RecentFailedImport[];
}

export interface FuelSnapshot {
  petrol: number;
  diesel: number;
  electric: number;
  hybrid: number;
  cng: number;
  strongest_segment: string;
  total_variants: number;
}

export interface ComparisonSummary {
  total: number;
  published: number;
  draft: number;
  cars_without_comparisons: number;
  recent_updated: number;
}

export interface GlobalSearchResult {
  type: 'car' | 'variant' | 'seo_collection' | 'comparison' | 'blog';
  id: string;
  title: string;
  subtitle?: string;
  link: string;
}

export interface GlobalSearchResponse {
  cars: GlobalSearchResult[];
  variants: GlobalSearchResult[];
  seo_collections: GlobalSearchResult[];
  comparisons: GlobalSearchResult[];
  blogs: GlobalSearchResult[];
  total: number;
}

export interface SystemStatus {
  status: 'healthy' | 'warning' | 'critical';
  message: string;
  details: string[];
}
