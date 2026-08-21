import { describe, expect, it } from 'vitest';
import { INITIAL_DATA } from '../constants.js';
import { COLLECTIONS } from './editorSchema.js';

describe('collection specs', () => {
  it('covers every editable collection', () => {
    expect(COLLECTIONS.map((c) => c.key).sort()).toEqual(
      ['blogs', 'gallery', 'process', 'projects', 'services', 'social', 'tools'].sort(),
    );
  });

  it('names only fields that exist on the seeded data', () => {
    for (const spec of COLLECTIONS) {
      const sample = (INITIAL_DATA as any)[spec.key][0];
      if (!sample) continue;
      for (const field of spec.fields) {
        expect(Object.keys(sample), `${spec.key}.${field.key}`).toContain(field.key);
      }
    }
  });

  it('gives every collection a label and a title field', () => {
    for (const spec of COLLECTIONS) {
      expect(spec.label.length).toBeGreaterThan(0);
      expect(spec.fields.some((f) => f.key === spec.titleField)).toBe(true);
    }
  });
});
