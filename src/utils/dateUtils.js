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

export const parseDeadlineTextToDate = (deadlineText, baseDateStr) => {
  if (!deadlineText) return null;
  const text = deadlineText.toLowerCase().trim();
  
  const baseDate = baseDateStr ? new Date(baseDateStr) : new Date(Date.now() - 2 * 60 * 60 * 1000);
  
  const addDays = (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  };
  
  const formatDate = (date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // 1. Tomorrow / Завтра
  if (text.includes('завтра')) {
    return formatDate(addDays(baseDate, 1));
  }
  
  // 2. Day after tomorrow / Послезавтра
  if (text.includes('послезавтра')) {
    return formatDate(addDays(baseDate, 2));
  }
  
  // 3. In X days / Через X дней / Через X дня
  const m = text.match(/через\s+(\d+)\s+(день|дня|дней)/);
  if (m) {
    const days = parseInt(m[1], 10);
    return formatDate(addDays(baseDate, days));
  }
  
  // Try matching just a number of days like "2 дня"
  const m2 = text.match(/(\d+)\s+(день|дня|дней)/);
  if (m2) {
    const days = parseInt(m2[1], 10);
    return formatDate(addDays(baseDate, days));
  }

  // 4. Weekdays: понедельник, вторник, среда, четверг, пятница, суббота, воскресенье
  const weekdays = [
    { names: ['понедельник', 'пн'], dayNum: 1 },
    { names: ['вторник', 'вт'], dayNum: 2 },
    { names: ['сред', 'ср'], dayNum: 3 },
    { names: ['четверг', 'чт'], dayNum: 4 },
    { names: ['пятниц', 'пт'], dayNum: 5 },
    { names: ['суббот', 'сб'], dayNum: 6 },
    { names: ['воскресень', 'вс'], dayNum: 0 }
  ];
  
  for (const day of weekdays) {
    if (day.names.some(name => {
      if (name.length <= 2) {
        const regex = new RegExp('(^|[^а-яё])' + name + '([^а-яё]|$)', 'i');
        return regex.test(text);
      }
      return text.includes(name);
    })) {
      const currentDay = baseDate.getDay(); // 0-6 (0 is Sunday)
      let daysToAdd = day.dayNum - currentDay;
      if (daysToAdd <= 0) {
        daysToAdd += 7; // Next week's occurrence
      }
      return formatDate(addDays(baseDate, daysToAdd));
    }
  }

  // 5. In a week / Через неделю
  if (text.includes('неделю') || text.includes('через неделю')) {
    return formatDate(addDays(baseDate, 7));
  }

  return null;
};
