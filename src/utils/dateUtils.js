// Date utilities for Abaddon's Task Manager
// Implements 5:00 AM Moscow Time daily reset offset (UTC-2 hours virtual today)

export const getVirtualTodayStr = () => {
  // MSK is UTC+3. Daily reset is at 5:00 AM MSK.
  // MSK - 5 hours = UTC + 3 - 5 = UTC - 2 hours.
  const virtualMs = Date.now() - 2 * 60 * 60 * 1000;
  const d = new Date(virtualMs);
  
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export const getVirtualTomorrowStr = () => {
  const virtualMs = Date.now() - 2 * 60 * 60 * 1000 + 24 * 60 * 60 * 1000;
  const d = new Date(virtualMs);
  
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};
