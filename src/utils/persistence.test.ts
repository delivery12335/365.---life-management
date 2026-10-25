import { describe, it, expect } from 'vitest';
import { emptyData } from '../data/emptyData';
import { readData, migrateLegacyData } from './persistence';
describe('empty production data', () => {
  it('starts without a generated profile, records, or balance', () => {
    expect(emptyData()).toEqual({
      version: 1,
      name: '',
      tasks: [],
      habits: [],
      goals: [],
      events: [],
      health: [],
      transactions: [],
      notes: [],
      openingBalance: 0,
    });
    expect(readData(null)).toEqual(emptyData());
  });
  it('creates independent empty arrays for each new account', () => {
    const first = emptyData(),
      second = emptyData();
    first.notes?.push({
      id: 'one',
      title: 'My note',
      content: '',
      createdAt: '2026-10-25T12:00:00Z',
      updatedAt: '2026-10-25T12:00:00Z',
      pinned: false,
    });
    expect(second.notes).toEqual([]);
  });
  it('does not repopulate missing or deliberately empty sections', () => {
    const data = { version: 1 as const, name: 'Real name', tasks: [], habits: [], goals: [] };
    expect(readData(JSON.stringify(data)).health).toEqual([]);
    expect(readData(JSON.stringify(emptyData()))).toEqual(emptyData());
  });
  it('keeps real user-created records when removing the legacy reserved seed IDs', () => {
    const real = {
      id: 'user-created-id',
      title: 'My own task',
      description: '',
      category: 'Personal' as const,
      priority: 'Medium' as const,
      dueDate: '2026-10-25',
      time: '',
      completed: false,
    };
    const data = {
      ...emptyData(),
      name: 'Real name',
      tasks: [{ ...real, id: 't1' }, real],
      health: [
        {
          id: 'health-demo-0',
          date: '2026-10-25',
          steps: 42,
          stepGoal: 50,
          water: 1,
          waterGoal: 2,
          sleep: 7,
          exercise: 2,
        },
      ],
    };
    const clean = migrateLegacyData(data);
    expect(clean.tasks).toEqual([real]);
    expect(clean.health).toEqual([]);
    expect(clean.name).toBe('Real name');
    expect(migrateLegacyData(clean)).toEqual(clean);
  });
  it('removes the former automatic profile name', () => {
    expect(migrateLegacyData({ ...emptyData(), name: 'Max' }).name).toBe('');
  });
  it('rejects unreadable or incompatible records instead of generating replacements', () => {
    expect(() => readData('{')).toThrow();
    expect(() => readData('{"version":99}')).toThrow();
  });
});
