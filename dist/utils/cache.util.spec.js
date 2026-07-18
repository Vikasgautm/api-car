"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const cache_util_1 = require("./cache.util");
(0, vitest_1.describe)('cache debug helpers', () => {
    (0, vitest_1.afterEach)(() => cache_util_1.cache.clear());
    (0, vitest_1.it)('exposes current entries and removes a specific key', () => {
        cache_util_1.cache.set('alpha', { ok: true }, 60_000);
        cache_util_1.cache.set('beta', { ok: false }, 60_000);
        const snapshot = cache_util_1.cache.debugSnapshot();
        (0, vitest_1.expect)(snapshot).toEqual(vitest_1.expect.arrayContaining([
            vitest_1.expect.objectContaining({ key: 'alpha' }),
            vitest_1.expect.objectContaining({ key: 'beta' }),
        ]));
        cache_util_1.cache.delete('alpha');
        (0, vitest_1.expect)(cache_util_1.cache.debugSnapshot().map((entry) => entry.key)).toEqual(['beta']);
    });
});
