import { describe, expect, it } from 'vitest';
import { assertImportOwnership } from './importGuard';

describe('import ownership', () => {
  it('allows new records and repeat imports for the same journey', () => {
    expect(() => assertImportOwnership([{ id: 'a', journeyId: 'j' }, { id: 'b', journeyId: 'j' }], [{ id: 'a', journeyId: 'j' }])).not.toThrow();
  });
  it('rejects records belonging to another journey, including deleted records', () => {
    expect(() => assertImportOwnership([{ id: 'a', journeyId: 'j' }], [{ id: 'a', journeyId: 'other' }])).toThrow('冲突');
  });
  it('rejects duplicate IDs before import', () => {
    expect(() => assertImportOwnership([{ id: 'a', journeyId: 'j' }, { id: 'a', journeyId: 'j' }], [])).toThrow('重复');
  });
});
