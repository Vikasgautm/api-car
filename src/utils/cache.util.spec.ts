import { afterEach, describe, expect, it } from 'vitest';
import { cache } from './cache.util';

describe('cache debug helpers', () => {
  afterEach(() => cache.clear());

  it('exposes current entries and removes a specific key', () => {
    cache.set('alpha', { ok: true }, 60_000);
    cache.set('beta', { ok: false }, 60_000);

    const snapshot = cache.debugSnapshot();
    expect(snapshot).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: 'alpha' }),
        expect.objectContaining({ key: 'beta' }),
      ]),
    );

    cache.delete('alpha');
    expect(cache.debugSnapshot().map((entry) => entry.key)).toEqual(['beta']);
  });
});
