const PROFILE_KEY = 'lumina_profile';

export function getProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveProfile(profile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function updateProfile(partial) {
  const current = getProfile() || {};
  saveProfile({ ...current, ...partial });
}

export function clearProfile() {
  localStorage.removeItem(PROFILE_KEY);
}

export function hasCompletedOnboarding() {
  return getProfile()?.onboardingCompleted === true;
}
