const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const SCHEDULE_PATH = path.join(DATA_DIR, 'pro-schedules.json');

const DEFAULT_SCHEDULE = {
  timezone: 'Europe/Paris',
  weekly: {
    1: { enabled: true, ranges: [{ start: '08:00', end: '12:00' }, { start: '14:00', end: '18:00' }] },
    2: { enabled: true, ranges: [{ start: '08:00', end: '12:00' }, { start: '14:00', end: '18:00' }] },
    3: { enabled: true, ranges: [{ start: '08:00', end: '12:00' }, { start: '14:00', end: '18:00' }] },
    4: { enabled: true, ranges: [{ start: '08:00', end: '12:00' }, { start: '14:00', end: '18:00' }] },
    5: { enabled: true, ranges: [{ start: '08:00', end: '12:00' }, { start: '14:00', end: '18:00' }] },
    6: { enabled: true, ranges: [{ start: '09:00', end: '13:00' }] },
    0: { enabled: false, ranges: [] },
  },
  daysOff: [],
};

const ensureStoreFile = () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(SCHEDULE_PATH)) {
    fs.writeFileSync(SCHEDULE_PATH, JSON.stringify({}, null, 2));
  }
};

const readState = () => {
  ensureStoreFile();

  try {
    return JSON.parse(fs.readFileSync(SCHEDULE_PATH, 'utf8'));
  } catch (error) {
    return {};
  }
};

const writeState = (state) => {
  ensureStoreFile();
  fs.writeFileSync(SCHEDULE_PATH, JSON.stringify(state, null, 2));
};

const cloneDefaultSchedule = () => JSON.parse(JSON.stringify(DEFAULT_SCHEDULE));

const sanitizeTime = (value, fallback) => {
  const normalized = String(value || '').trim();
  return /^\d{2}:\d{2}$/.test(normalized) ? normalized : fallback;
};

const sanitizeRanges = (ranges = []) => {
  const cleaned = (Array.isArray(ranges) ? ranges : [])
    .map((range) => ({
      start: sanitizeTime(range?.start, '08:00'),
      end: sanitizeTime(range?.end, '12:00'),
    }))
    .filter((range) => range.start < range.end)
    .sort((a, b) => a.start.localeCompare(b.start));

  return cleaned.slice(0, 3);
};

const sanitizeDaysOff = (daysOff = []) =>
  [...new Set((Array.isArray(daysOff) ? daysOff : [])
    .map((value) => String(value || '').trim())
    .filter((value) => /^\d{4}-\d{2}-\d{2}$/.test(value)))]
    .sort();

const sanitizeSchedule = (input = {}) => {
  const base = cloneDefaultSchedule();
  const weekly = {};

  for (const dayKey of Object.keys(base.weekly)) {
    const sourceDay = input.weekly?.[dayKey] || base.weekly[dayKey];
    weekly[dayKey] = {
      enabled: Boolean(sourceDay?.enabled),
      ranges: sanitizeRanges(sourceDay?.ranges),
    };
  }

  return {
    timezone: String(input.timezone || base.timezone),
    weekly,
    daysOff: sanitizeDaysOff(input.daysOff),
  };
};

const getProfessionalSchedule = (professionalId) => {
  const state = readState();
  return sanitizeSchedule(state[professionalId] || cloneDefaultSchedule());
};

const updateProfessionalSchedule = (professionalId, payload) => {
  const state = readState();
  const nextValue = sanitizeSchedule(payload);
  state[professionalId] = nextValue;
  writeState(state);
  return nextValue;
};

const isDateMarkedOff = (schedule, date) => schedule.daysOff.includes(date);

const getScheduleForDate = (schedule, date) => {
  const dayIndex = new Date(`${date}T00:00:00`).getDay();
  return schedule.weekly[String(dayIndex)] || { enabled: false, ranges: [] };
};

const getAutomaticDayRanges = (date) => {
  const dayIndex = new Date(`${date}T00:00:00`).getDay();

  if ([1, 2, 3, 4, 5].includes(dayIndex)) {
    return [{ start: '08:00', end: '12:00' }, { start: '14:00', end: '18:00' }];
  }

  if (dayIndex === 6) {
    return [{ start: '09:00', end: '13:00' }];
  }

  return [];
};

const slotMatchesRanges = (time, ranges = []) =>
  ranges.some((range) => time >= range.start && time < range.end);

const isSlotAllowedBySchedule = (schedule, date, time) => {
  if (!date || !time) return false;
  if (isDateMarkedOff(schedule, date)) return false;

  const dayConfig = getScheduleForDate(schedule, date);
  const configuredRanges = dayConfig?.enabled ? (dayConfig.ranges || []) : [];
  const automaticRanges = getAutomaticDayRanges(date);

  if (slotMatchesRanges(time, configuredRanges)) return true;

  return slotMatchesRanges(time, automaticRanges);
};

const getAvailableSlotsForDate = (schedule, date, slots = []) => {
  if (!date) return [];
  return slots.filter((slot) => isSlotAllowedBySchedule(schedule, date, slot));
};

module.exports = {
  getProfessionalSchedule,
  updateProfessionalSchedule,
  isSlotAllowedBySchedule,
  getAvailableSlotsForDate,
};
