import { useState, useEffect, useCallback, useRef } from 'react';
import { getProfile } from '../utils/profile';
import { getCardGradient } from '../utils/cardGradient';
import {
  getPlan,
  getTodayActivities,
  markActivityCompleted,
  unmarkActivityCompleted,
  getWeekDays,
  getEffectiveStreak,
  syncStreak,
  ACHIEVEMENTS,
  getAchievementStatus,
  TIERS,
} from '../utils/plan';

// ─── Helper: Spanish date label ───────────────────────────────────────────────
function getTodayLabel() {
  return new Date().toLocaleDateString('es', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

// Capitalise first letter
function cap(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ─── Sub-component: StreakCard ────────────────────────────────────────────────
function StreakCard({ streak, animate }) {
  return (
    <div style={{
      margin: '8px 20px 0',
      background: 'linear-gradient(135deg, rgba(255,255,255,0.55), rgba(255,196,209,0.3))',
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      border: '1px solid rgba(255,255,255,0.4)',
      borderRadius: 24,
      padding: '24px 28px',
      textAlign: 'center',
      boxShadow: '0 4px 20px rgba(250,147,165,0.15), inset 0 1px 0 rgba(255,255,255,0.5)',
    }}>
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        transition: 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1)',
        transform: animate ? 'scale(1.18)' : 'scale(1)',
      }}>
        <span style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: 60,
          fontWeight: 700,
          color: 'var(--rose)',
          lineHeight: 1,
        }}>
          {streak}
        </span>
        {streak > 0 && (
          <span style={{ fontSize: 36, lineHeight: 1 }}>🔥</span>
        )}
        {streak === 0 && (
          <span style={{ fontSize: 36, lineHeight: 1 }}>✨</span>
        )}
      </div>
      <p style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 12,
        color: 'var(--text-light)',
        marginTop: 6,
        letterSpacing: 0.3,
      }}>
        {streak === 0 ? 'Empieza hoy' : streak === 1 ? '1 día seguido' : `${streak} días seguidos`}
      </p>
    </div>
  );
}

// ─── Sub-component: ActivityCard ──────────────────────────────────────────────
function ActivityCard({ activity, completed, onToggle, index, total }) {
  return (
    <button
      className="card-hover"
      onClick={() => onToggle(activity.id, activity.category)}
      style={{
        width: '100%',
        background: completed ? 'rgba(255,217,225,0.6)' : getCardGradient(index, total),
        border: `1px solid ${completed ? 'var(--pink-light)' : 'var(--border)'}`,
        borderRadius: 18,
        padding: '14px 16px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        boxShadow: 'var(--shadow)',
        textAlign: 'left',
        transition: 'background 0.25s ease, border-color 0.25s ease',
      }}
    >
      {/* Emoji circle */}
      <div style={{
        width: 50,
        height: 50,
        borderRadius: '50%',
        background: completed ? 'var(--bg-soft)' : 'rgba(255,255,255,0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 24,
        flexShrink: 0,
      }}>
        {activity.emoji}
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: 16,
          fontWeight: 600,
          color: completed ? 'var(--text-muted)' : 'var(--rose)',
          lineHeight: 1.25,
          textDecoration: completed ? 'line-through' : 'none',
          marginBottom: 2,
        }}>
          {activity.title}
        </p>
        <p style={{
          fontSize: 12,
          color: 'var(--text-light)',
          lineHeight: 1.4,
        }}>
          {activity.desc}
        </p>
      </div>

      {/* Check circle */}
      <div style={{
        width: 24,
        height: 24,
        borderRadius: '50%',
        border: completed ? 'none' : '1.5px solid var(--border)',
        background: completed ? 'var(--green)' : 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        transition: 'background 0.25s ease, border 0.25s ease',
      }}>
        {completed && (
          <span style={{
            color: 'white',
            fontSize: 13,
            fontWeight: 700,
            lineHeight: 1,
          }}>
            ✓
          </span>
        )}
      </div>
    </button>
  );
}

// ─── Sub-component: WeekStrip ─────────────────────────────────────────────────
function WeekStrip({ days }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      padding: '0 20px',
    }}>
      {days.map((day) => {
        let bg = 'var(--bg-card)';
        let color = 'var(--text-muted)';
        let border = '1px solid var(--border)';
        let textDecoration = 'none';

        if (day.isCompleted) {
          bg = 'var(--pink)';
          color = 'white';
          border = 'none';
        } else if (day.isToday) {
          bg = 'var(--bg-card)';
          color = 'var(--rose)';
          border = '2px solid var(--rose)';
        } else if (day.isPast && !day.isCompleted) {
          color = 'var(--text-light)';
          textDecoration = 'line-through';
        }

        return (
          <div key={day.date} style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
          }}>
            <span style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 10,
              color: 'var(--text-muted)',
              letterSpacing: 0.3,
              fontWeight: 500,
            }}>
              {day.dayLabel}
            </span>
            <div style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              background: bg,
              border,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <span style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 12,
                fontWeight: day.isToday ? 700 : 400,
                color,
                textDecoration,
              }}>
                {day.dayNum}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Sub-component: AchievementCard ──────────────────────────────────────────
function AchievementCard({ achievement, plan }) {
  const { tier, tierName, tierEmoji, value, nextThreshold, isMax } = getAchievementStatus(achievement, plan);
  const achieved = tier > 0;

  let progress;
  if (isMax) {
    progress = '¡Nivel máximo! 💎';
  } else if (achieved) {
    const nextTierName = TIERS[tier];
    progress = `${nextTierName}: ${Math.min(value, nextThreshold)}/${nextThreshold}`;
  } else {
    progress = `${Math.min(value, achievement.thresholds[0])} / ${achievement.thresholds[0]}`;
  }

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 18,
      padding: '18px 14px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 6,
      boxShadow: 'var(--shadow)',
      opacity: achieved ? 1 : 0.5,
      filter: achieved ? 'none' : 'grayscale(0.6)',
      transition: 'opacity 0.4s ease',
    }}>
      <span style={{ fontSize: 32, lineHeight: 1 }}>{achievement.emoji}</span>
      <p className="font-display" style={{ fontSize: 14, color: 'var(--text)', textAlign: 'center', lineHeight: 1.2 }}>
        {achievement.label}
      </p>
      {achieved && (
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 11,
          fontWeight: 700,
          color: 'var(--rose)',
          letterSpacing: 0.2,
        }}>
          {tierEmoji} {tierName}
        </p>
      )}
      <p style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 10,
        color: isMax ? 'var(--green)' : 'var(--text-light)',
        fontWeight: isMax ? 600 : 400,
        letterSpacing: 0.2,
        textAlign: 'center',
      }}>
        {progress}
      </p>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function PlanScreen() {
  // syncStreak() zeroes a broken streak (missed a full day) before first render.
  const [plan, setPlan] = useState(() => syncStreak());
  const [activities, setActivities] = useState([]);
  const [weekDays, setWeekDays] = useState([]);
  const [streakAnimate, setStreakAnimate] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  // Initialise on mount
  useEffect(() => {
    const profile = getProfile();
    setActivities(getTodayActivities(profile));
    setWeekDays(getWeekDays());
  }, []);

  const showToast = useCallback((msg) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  }, []);

  const handleToggle = useCallback((activityId, category) => {
    const currentPlan = getPlan();
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    // Sync todayDate so completions reflect today
    const effectiveCompletions = currentPlan.todayDate === today
      ? currentPlan.todayCompletions
      : [];
    const alreadyDone = effectiveCompletions.includes(activityId);

    if (alreadyDone) {
      // Untoggle
      unmarkActivityCompleted(activityId);
      const updated = getPlan();
      setPlan(updated);
      setWeekDays(getWeekDays());
    } else {
      // Was this the first completion of the day?
      const wasFirst = effectiveCompletions.length === 0;

      const leveledUp = markActivityCompleted(activityId, category);
      const updated = getPlan();
      setPlan(updated);
      setWeekDays(getWeekDays());

      // Animate streak on first completion of the day
      if (wasFirst) {
        setStreakAnimate(true);
        setTimeout(() => setStreakAnimate(false), 450);
      }

      // Achievement level-up toast
      if (leveledUp) {
        showToast(`¡Subiste a ${leveledUp.label} ${leveledUp.tierName}! 🎉`);
      }
    }
  }, [showToast]);

  // Resolve today's completions guarding for day change (local date, not UTC)
  const _now = new Date();
  const today = `${_now.getFullYear()}-${String(_now.getMonth() + 1).padStart(2, '0')}-${String(_now.getDate()).padStart(2, '0')}`;
  const todayCompletions = plan.todayDate === today ? plan.todayCompletions : [];

  return (
    <div className="slide-in" style={{ paddingBottom: 16 }}>
      {/* ── Header ── */}
      <div style={{ padding: '16px 20px 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 18 }}>📋</span>
        <h1 className="font-display" style={{ fontSize: 26, color: 'var(--text)' }}>Tu Plan</h1>
      </div>

      {/* ── Streak card (effective streak: shows 0 if a full day was missed) ── */}
      <StreakCard streak={getEffectiveStreak(plan)} animate={streakAnimate} />

      {/* ── Hoy section ── */}
      <div style={{ marginTop: 28, padding: '0 20px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
          <h2 className="font-display" style={{ fontSize: 20, color: 'var(--text)' }}>
            Hoy
          </h2>
          <span style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 11,
            fontStyle: 'italic',
            color: 'var(--text-light)',
          }}>
            {cap(getTodayLabel())}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
          {activities.map((act, idx) => (
            <ActivityCard
              key={act.id}
              activity={act}
              completed={todayCompletions.includes(act.id)}
              onToggle={handleToggle}
              index={idx}
              total={activities.length}
            />
          ))}
        </div>
      </div>

      {/* ── Esta Semana section ── */}
      <div style={{ marginTop: 28 }}>
        <h2 className="font-display" style={{ fontSize: 20, color: 'var(--text)', padding: '0 20px', marginBottom: 14 }}>
          Esta Semana
        </h2>
        <WeekStrip days={weekDays} />
      </div>

      {/* ── Tus Logros section ── */}
      <div style={{ marginTop: 28, padding: '0 20px' }}>
        <h2 className="font-display" style={{ fontSize: 20, color: 'var(--text)', marginBottom: 14 }}>
          Tus Logros
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
        }}>
          {ACHIEVEMENTS.map((ach) => (
            <AchievementCard
              key={ach.id}
              achievement={ach}
              plan={plan}
            />
          ))}
        </div>
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: 'calc(80px + var(--safe-bottom))',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'var(--rose)',
          color: 'white',
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 14,
          fontWeight: 500,
          padding: '11px 22px',
          borderRadius: 20,
          whiteSpace: 'nowrap',
          boxShadow: '0 4px 20px rgba(130,98,110,0.35)',
          animation: 'fadeIn 0.2s ease',
          zIndex: 999,
          maxWidth: 'calc(100% - 40px)',
          textAlign: 'center',
        }}>
          {toast}
        </div>
      )}
    </div>
  );
}
