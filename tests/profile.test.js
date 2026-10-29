import { describe, it, expect, beforeEach } from 'vitest';
import { getProfile, saveProfile, updateProfile, clearProfile, hasCompletedOnboarding } from '../src/utils/profile.js';

beforeEach(() => {
  localStorage.clear();
});

describe('getProfile / saveProfile', () => {
  it('returns null when nothing is stored', () => {
    expect(getProfile()).toBeNull();
  });

  it('round-trips a saved profile', () => {
    saveProfile({ name: 'Val', colorSubtono: 'frio' });
    expect(getProfile()).toEqual({ name: 'Val', colorSubtono: 'frio' });
  });

  it('does not crash and returns null on corrupted JSON in storage', () => {
    localStorage.setItem('lumina_profile', '{not valid json::');
    expect(() => getProfile()).not.toThrow();
    expect(getProfile()).toBeNull();
  });
});

describe('updateProfile', () => {
  it('merges new fields without wiping existing ones', () => {
    saveProfile({ name: 'Val', colorSubtono: 'frio' });
    updateProfile({ skinType: 'mixta' });
    expect(getProfile()).toEqual({ name: 'Val', colorSubtono: 'frio', skinType: 'mixta' });
  });

  it('overwrites only the fields explicitly passed', () => {
    saveProfile({ name: 'Val', colorSubtono: 'frio' });
    updateProfile({ colorSubtono: 'calido' });
    expect(getProfile()).toEqual({ name: 'Val', colorSubtono: 'calido' });
  });

  it('works from an empty/missing profile', () => {
    updateProfile({ name: 'Nueva' });
    expect(getProfile()).toEqual({ name: 'Nueva' });
  });

  it('tolerates corrupted JSON in storage instead of crashing', () => {
    localStorage.setItem('lumina_profile', '{{{broken');
    expect(() => updateProfile({ name: 'Val' })).not.toThrow();
    expect(getProfile()).toEqual({ name: 'Val' });
  });
});

describe('clearProfile', () => {
  it('removes the stored profile', () => {
    saveProfile({ name: 'Val' });
    clearProfile();
    expect(getProfile()).toBeNull();
  });
});

describe('hasCompletedOnboarding', () => {
  it('is false when there is no profile', () => {
    expect(hasCompletedOnboarding()).toBe(false);
  });

  it('is false when onboardingCompleted is missing or falsy', () => {
    saveProfile({ name: 'Val' });
    expect(hasCompletedOnboarding()).toBe(false);
    saveProfile({ name: 'Val', onboardingCompleted: false });
    expect(hasCompletedOnboarding()).toBe(false);
  });

  it('is true when onboardingCompleted is exactly true', () => {
    saveProfile({ name: 'Val', onboardingCompleted: true });
    expect(hasCompletedOnboarding()).toBe(true);
  });
});
