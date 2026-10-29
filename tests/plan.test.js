import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getPlan,
  getEffectiveStreak,
  syncStreak,
  markActivityCompleted,
  getTodayActivities,
  getWeekDays,
  getAchievementStatus,
  ACHIEVEMENTS,
} from '../src/utils/plan.js';

// Fixed "today" for every test in this file: Tuesday 2026-07-21.
const TODAY_ISO = '2026-07-21';
const YESTERDAY_ISO = '2026-07-20';
const TWO_DAYS_AGO_ISO = '2026-07-19';

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 6, 21, 12, 0, 0));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('getEffectiveStreak', () => {
  it('returns the streak when the last completion was today', () => {
    expect(getEffectiveStreak({ streak: 5, lastCompletionDate: TODAY_ISO })).toBe(5);
  });

  it('returns the streak when the last completion was yesterday', () => {
    expect(getEffectiveStreak({ streak: 5, lastCompletionDate: YESTERDAY_ISO })).toBe(5);
  });

  it('returns 0 when the last completion was 2+ days ago (broken streak)', () => {
    expect(getEffectiveStreak({ streak: 5, lastCompletionDate: TWO_DAYS_AGO_ISO })).toBe(0);
  });

  it('returns 0 for a plan with no completions at all', () => {
    expect(getEffectiveStreak({})).toBe(0);
    expect(getEffectiveStreak({ streak: 0, lastCompletionDate: null })).toBe(0);
  });
});

describe('syncStreak', () => {
  it('zeroes out and persists a broken streak', () => {
    localStorage.setItem('lumina_plan', JSON.stringify({
      streak: 5, lastCompletionDate: '2026-07-10', todayDate: TODAY_ISO, todayCompletions: [],
    }));
    const plan = syncStreak();
    expect(plan.streak).toBe(0);
    const stored = JSON.parse(localStorage.getItem('lumina_plan'));
    expect(stored.streak).toBe(0);
  });

  it('clears todayCompletions when the stored day is not today', () => {
    localStorage.setItem('lumina_plan', JSON.stringify({
      streak: 2, lastCompletionDate: TODAY_ISO, todayDate: YESTERDAY_ISO, todayCompletions: ['skin_cleanse'],
    }));
    const plan = syncStreak();
    expect(plan.todayCompletions).toEqual([]);
    expect(plan.todayDate).toBe(TODAY_ISO);
  });

  it('leaves a healthy, unbroken streak untouched', () => {
    localStorage.setItem('lumina_plan', JSON.stringify({
      streak: 3, lastCompletionDate: TODAY_ISO, todayDate: TODAY_ISO, todayCompletions: ['skin_cleanse'],
    }));
    const plan = syncStreak();
    expect(plan.streak).toBe(3);
    expect(plan.todayCompletions).toEqual(['skin_cleanse']);
  });
});

describe('markActivityCompleted', () => {
  it('starts the streak at 1 on the very first completion ever', () => {
    markActivityCompleted('skin_cleanse', 'skin');
    const plan = getPlan();
    expect(plan.streak).toBe(1);
    expect(plan.lastCompletionDate).toBe(TODAY_ISO);
    expect(plan.completedDays).toContain(TODAY_ISO);
  });

  it('increments the streak by 1 on a consecutive day', () => {
    localStorage.setItem('lumina_plan', JSON.stringify({
      streak: 3, lastCompletionDate: YESTERDAY_ISO, todayDate: YESTERDAY_ISO,
      todayCompletions: [], completedDays: [YESTERDAY_ISO], longestStreak: 3,
    }));
    markActivityCompleted('skin_cleanse', 'skin');
    expect(getPlan().streak).toBe(4);
  });

  it('resets the streak to 1 after a gap of 2+ days', () => {
    localStorage.setItem('lumina_plan', JSON.stringify({
      streak: 5, lastCompletionDate: '2026-07-10', todayDate: '2026-07-10',
      todayCompletions: [], completedDays: ['2026-07-10'], longestStreak: 5,
    }));
    markActivityCompleted('skin_cleanse', 'skin');
    expect(getPlan().streak).toBe(1);
  });

  it('does not double-count marking the same activity twice in the same day', () => {
    markActivityCompleted('skin_cleanse', 'skin');
    const after1 = getPlan();
    markActivityCompleted('skin_cleanse', 'skin');
    const after2 = getPlan();

    expect(after2.totalCompletions).toBe(after1.totalCompletions);
    expect(after2.streak).toBe(after1.streak);
    expect(after2.todayCompletions).toEqual(['skin_cleanse']);
  });

  it('raises achievement tiers as thresholds are crossed', () => {
    // 'dedicacion' (totalCompletions) unlocks Bronze at 10 completions.
    for (let i = 0; i < 10; i++) {
      markActivityCompleted(`activity_${i}`, 'skin');
    }
    const plan = getPlan();
    expect(plan.totalCompletions).toBe(10);
    expect(plan.achievementTiers.dedicacion).toBe(1);
  });

  it('reports a leveled-up achievement from its return value', () => {
    localStorage.setItem('lumina_plan', JSON.stringify({
      streak: 0, lastCompletionDate: null, todayDate: TODAY_ISO, todayCompletions: [],
      totalCompletions: 9, completedDays: [], achievementTiers: {},
    }));
    const result = markActivityCompleted('one_more', 'skin');
    expect(result).toEqual(expect.objectContaining({ id: 'dedicacion', tierName: 'Bronce' }));
  });
});

describe('getAchievementStatus (tier permanence)', () => {
  it('never reports a lower tier than what is already persisted, even if the metric regressed', () => {
    const ach = ACHIEVEMENTS.find((a) => a.id === 'dedicacion');
    const status = getAchievementStatus(ach, { achievementTiers: { dedicacion: 3 }, totalCompletions: 0 });
    expect(status.tier).toBe(3);
  });

  it('reports the tier earned by the current metric when it is higher than what is stored', () => {
    const ach = ACHIEVEMENTS.find((a) => a.id === 'dedicacion');
    const status = getAchievementStatus(ach, { achievementTiers: { dedicacion: 0 }, totalCompletions: 30 });
    expect(status.tier).toBe(2); // thresholds [10,30,60,120] → 30 reaches tier 2 (Plata)
  });
});

describe('getTodayActivities', () => {
  it('returns 3 or 4 activities', () => {
    const acts = getTodayActivities(null);
    expect(acts.length).toBeGreaterThanOrEqual(3);
    expect(acts.length).toBeLessThanOrEqual(4);
  });

  it('never returns duplicate activities', () => {
    const acts = getTodayActivities({ goals: ['skincare'] });
    const ids = acts.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('is deterministic for the same date and profile', () => {
    const a = getTodayActivities({ goals: ['colorimetry'] }).map((x) => x.id);
    const b = getTodayActivities({ goals: ['colorimetry'] }).map((x) => x.id);
    expect(a).toEqual(b);
  });

  it('respects the profile goals by including a matching category activity', () => {
    const acts = getTodayActivities({ goals: ['skincare'] });
    expect(acts.some((a) => a.category === 'skin')).toBe(true);
  });

  it('still returns activities for a null/empty profile', () => {
    expect(getTodayActivities(null).length).toBeGreaterThanOrEqual(3);
    expect(getTodayActivities({}).length).toBeGreaterThanOrEqual(3);
  });
});

describe('getWeekDays', () => {
  it('returns 7 days, Monday through Sunday, with correct flags', () => {
    const days = getWeekDays();
    expect(days).toHaveLength(7);

    // 2026-07-21 is a Tuesday, so Monday of that week is 2026-07-20.
    expect(days[0].date).toBe('2026-07-20');
    expect(days[0].dayLabel).toBe('L');
    expect(days[6].date).toBe('2026-07-26');
    expect(days[6].dayLabel).toBe('D');

    const today = days.find((d) => d.isToday);
    expect(today.date).toBe(TODAY_ISO);
    expect(today.isPast).toBe(false);
    expect(today.isFuture).toBe(false);

    expect(days[0].isPast).toBe(true);
    expect(days[6].isFuture).toBe(true);
  });

  it('marks completed days from the plan', () => {
    localStorage.setItem('lumina_plan', JSON.stringify({ completedDays: [YESTERDAY_ISO] }));
    const days = getWeekDays();
    const yesterday = days.find((d) => d.date === YESTERDAY_ISO);
    expect(yesterday.isCompleted).toBe(true);
    const today = days.find((d) => d.isToday);
    expect(today.isCompleted).toBe(false);
  });
});
