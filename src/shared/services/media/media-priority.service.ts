import { EXTERIOR_PRIORITY, INTERIOR_PRIORITY } from './media-constants';

export interface ImageRecord {
  url: string;
  main_category?: string;
  sub_category?: string;
  is_primary?: boolean;
  media_scope?: string;
  status?: string;
  sort_order?: number;
}

export class MediaPriorityService {
  /**
   * From a list of published images for one car, return the best thumbnail:
   *   1. top_variant_showcase
   *   2. is_primary=true standard image
   *   3. exterior by priority order (front_left > front > side_left …)
   *   4. interior by priority order
   *   5. first available image
   */
  static selectCardThumbnail(images: ImageRecord[]): ImageRecord | null {
    if (!images.length) return null;

    const published = images.filter(i => i.status === 'published' || i.is_primary);

    const showcase = published.find(i => i.media_scope === 'top_variant_showcase');
    if (showcase) return showcase;

    const primary = published.find(i => i.is_primary);
    if (primary) return primary;

    for (const sub of EXTERIOR_PRIORITY) {
      const match = published.find(i => i.main_category === 'exterior' && i.sub_category === sub);
      if (match) return match;
    }

    for (const sub of INTERIOR_PRIORITY) {
      const match = published.find(i => i.main_category === 'interior' && i.sub_category === sub);
      if (match) return match;
    }

    return published[0] || images[0];
  }

  /**
   * Sort images within a category tab by the priority list first,
   * then by sort_order for remaining items.
   */
  static sortByPriority(images: ImageRecord[], mainCategory: string): ImageRecord[] {
    const priorityList =
      mainCategory === 'exterior' ? EXTERIOR_PRIORITY :
      mainCategory === 'interior' ? INTERIOR_PRIORITY : [];

    if (!priorityList.length) {
      return [...images].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    }

    const prioritised = priorityList
      .map(sub => images.filter(i => i.sub_category === sub))
      .flat();

    const remaining = images
      .filter(i => !priorityList.includes(i.sub_category ?? ''))
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

    return [...prioritised, ...remaining];
  }
}
