import { describe, expect, it } from 'vitest';
import { pocs, pocYears } from '../features/pocs/data';

describe('POC records', () => {
  it('use unique IDs, listed years and the expected asset folder', () => {
    expect(new Set(pocs.map(person => person.id)).size).toBe(pocs.length);
    expect(new Set(pocYears).size).toBe(pocYears.length);
    for (const person of pocs) {
      expect(person.name.trim(), person.id).not.toBe('');
      expect(person.role.trim(), person.id).not.toBe('');
      expect(pocYears, person.id).toContain(person.year);
      if (person.photo) expect(person.photo, person.id).toMatch(new RegExp(`^/assets/pocs/${person.year}/`));
      if (person.profileUrl) expect(new URL(person.profileUrl).protocol, person.id).toBe('https:');
      if (person.experience !== undefined) expect(person.experience.trim(), person.id).not.toBe('');
    }
  });

  it('have one point of contact per year', () => {
    const years = pocs.map(person => person.year);
    expect(new Set(years).size).toBe(years.length);
  });

  it('never attach photos or links to placeholder entries', () => {
    for (const person of pocs.filter(entry => entry.placeholder)) {
      expect(person.photo, person.id).toBeUndefined();
      expect(person.profileUrl, person.id).toBeUndefined();
    }
  });
});
