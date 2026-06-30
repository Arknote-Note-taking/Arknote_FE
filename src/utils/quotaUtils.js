const QUOTA_KEY = 'ai_quota_exhausted_until';

export const markQuotaExhausted = () => {
  const now = new Date();
  try {
    // 1. Get the current date/time in Pacific Time (PT)
    const ptString = now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" });
    const ptDate = new Date(ptString);
    
    // 2. Set to next midnight PT (00:00:00 of tomorrow PT)
    const nextMidnightPt = new Date(ptDate);
    nextMidnightPt.setDate(ptDate.getDate() + 1);
    nextMidnightPt.setHours(0, 0, 0, 0);
    
    // 3. Difference in ms
    const msToMidnight = nextMidnightPt.getTime() - ptDate.getTime();
    
    // 4. Absolute future epoch
    const resetAt = now.getTime() + msToMidnight;
    localStorage.setItem(QUOTA_KEY, String(resetAt));
  } catch (e) {
    // Fallback: reset in 12 hours if timezone formatting fails
    const resetAt = now.getTime() + 12 * 60 * 60 * 1000;
    localStorage.setItem(QUOTA_KEY, String(resetAt));
  }
};

/**
 * Returns { exhausted: boolean, resetAt: Date|null, msRemaining: number }
 */
export const getQuotaStatus = () => {
  const raw = localStorage.getItem(QUOTA_KEY);
  if (!raw) return { exhausted: false, resetAt: null, msRemaining: 0 };

  const resetAt = new Date(Number(raw));
  const msRemaining = resetAt.getTime() - Date.now();

  if (msRemaining <= 0) {
    localStorage.removeItem(QUOTA_KEY);
    return { exhausted: false, resetAt: null, msRemaining: 0 };
  }

  return { exhausted: true, resetAt, msRemaining };
};

/**
 * Format remaining milliseconds as "Xh Ym" countdown string.
 */
export const formatCountdown = (ms) => {
  if (ms <= 0) return '0 phút';
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours} giờ ${minutes} phút`;
  return `${minutes} phút`;
};
