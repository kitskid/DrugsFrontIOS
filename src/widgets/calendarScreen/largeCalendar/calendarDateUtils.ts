export const CALENDAR_MAX_WIDTH = 600;
export const LARGE_CALENDAR_HORIZONTAL_PADDING = 24;
export const WEEK_LENGTH = 7;

export const LARGE_CALENDAR_HEADER_HEIGHT = 48;
export const LARGE_CALENDAR_WEEKDAYS_HEIGHT = 40;
/** marginTop 12 + paddingVertical 16 + handle 4 + marginBottom 8 */
export const LARGE_CALENDAR_BOTTOM_HANDLE_HEIGHT = 40;
export const LARGE_CALENDAR_ROOT_PADDING_TOP = 12;

export type CalendarDayCell = {
  date: Date;
  isCurrentMonth: boolean;
};

const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

export const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export const sortDayRange = (a: Date, b: Date): [Date, Date] => {
  const dayA = startOfDay(a).getTime();
  const dayB = startOfDay(b).getTime();
  return dayA <= dayB ? [startOfDay(a), startOfDay(b)] : [startOfDay(b), startOfDay(a)];
};

const mondayBasedOffset = (date: Date) => {
  const sundayBased = date.getDay();
  return sundayBased === 0 ? 6 : sundayBased - 1;
};

export const CALENDAR_ROWS = 6;
export const CALENDAR_TOTAL_CELLS = CALENDAR_ROWS * WEEK_LENGTH;

/** Inner width available for the 7-column grid (root width minus horizontal padding). */
export const getLargeCalendarContentWidth = (layoutWidth: number): number => {
  const outer = Math.min(Math.max(layoutWidth, 1), CALENDAR_MAX_WIDTH);
  return Math.max(1, outer - LARGE_CALENDAR_HORIZONTAL_PADDING);
};

/** Day cell size so that 7 columns never exceed content width (avoids clipping Sunday). */
export const getLargeCalendarDaySize = (contentWidth: number): number => {
  const width = Math.max(1, contentWidth);
  return Math.max(1, Math.floor(width / WEEK_LENGTH));
};

export const getLargeCalendarHeights = (
  layoutWidth: number,
): {daySize: number; expanded: number; collapsed: number} => {
  const contentWidth = getLargeCalendarContentWidth(layoutWidth);
  const daySize = getLargeCalendarDaySize(contentWidth);
  const chrome =
    LARGE_CALENDAR_ROOT_PADDING_TOP +
    LARGE_CALENDAR_HEADER_HEIGHT +
    LARGE_CALENDAR_WEEKDAYS_HEIGHT +
    LARGE_CALENDAR_BOTTOM_HANDLE_HEIGHT;
  return {
    daySize,
    expanded: chrome + CALENDAR_ROWS * daySize,
    collapsed: chrome + daySize,
  };
};

// Month grids are pure for a given (year, month) and are rebuilt often while
// paging, so cache them. Stable references also let LargeCalendarGrid's memo
// skip work when the same month is rendered again. Max ~1200 entries.
const monthGridCache = new Map<string, CalendarDayCell[]>();

export const buildMonthGrid = (year: number, month: number): CalendarDayCell[] => {
  const cacheKey = `${year}-${month}`;
  const cached = monthGridCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const firstOfMonth = new Date(year, month, 1);
  const leadingEmpty = mondayBasedOffset(firstOfMonth);
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: CalendarDayCell[] = [];

  for (let i = 0; i < CALENDAR_TOTAL_CELLS; i += 1) {
    const dayIndex = i - leadingEmpty + 1;
    const date = new Date(year, month, dayIndex);
    cells.push({
      date,
      isCurrentMonth: dayIndex >= 1 && dayIndex <= daysInMonth,
    });
  }

  monthGridCache.set(cacheKey, cells);
  return cells;
};

export type MonthPageData = {
  year: number;
  month: number;
  days: CalendarDayCell[];
};

export const getMonthPageAtOffset = (
  anchor: Date,
  monthOffset: number,
): MonthPageData => {
  const date = new Date(anchor.getFullYear(), anchor.getMonth() + monthOffset, 1);
  const year = date.getFullYear();
  const month = date.getMonth();
  return {
    year,
    month,
    days: buildMonthGrid(year, month),
  };
};

export const isDayInOpenRange = (
  date: Date,
  rangeStart: Date | null,
  rangeEnd: Date | null,
) => {
  if (rangeStart === null || rangeEnd === null) {
    return false;
  }

  if (isSameDay(rangeStart, rangeEnd)) {
    return false;
  }

  const [start, end] = sortDayRange(rangeStart, rangeEnd);
  const time = startOfDay(date).getTime();
  return time > start.getTime() && time < end.getTime();
};

export const isRangeEndpoint = (
  date: Date,
  rangeStart: Date | null,
  rangeEnd: Date | null,
) => {
  if (rangeStart !== null && isSameDay(date, rangeStart)) {
    return true;
  }
  if (rangeEnd !== null && isSameDay(date, rangeEnd)) {
    return true;
  }
  return false;
};

/** Day that shows range fill (interval interior or start/end cap). */
export const isDayRangeHighlighted = (
  date: Date,
  rangeStart: Date | null,
  rangeEnd: Date | null,
): boolean => {
  if (rangeStart === null || rangeEnd === null) {
    return false;
  }
  if (isSameDay(rangeStart, rangeEnd)) {
    return false;
  }
  return (
    isRangeEndpoint(date, rangeStart, rangeEnd) ||
    isDayInOpenRange(date, rangeStart, rangeEnd)
  );
};

const DAY_MS = 24 * 60 * 60 * 1000;

export const addDays = (date: Date, days: number): Date => {
  const d = startOfDay(date);
  d.setDate(d.getDate() + days);
  return d;
};

export const getWeekStartMonday = (date: Date): Date => {
  const d = startOfDay(date);
  const offset = mondayBasedOffset(d);
  d.setDate(d.getDate() - offset);
  return d;
};

export const buildWeekAtOffset = (anchor: Date, weekOffset: number): Date[] => {
  const anchorMonday = getWeekStartMonday(anchor);
  const start = addDays(anchorMonday, weekOffset * WEEK_LENGTH);
  const week: Date[] = [];
  for (let j = 0; j < WEEK_LENGTH; j += 1) {
    week.push(addDays(start, j));
  }
  return week;
};

/** Month offset from anchor (0 = anchor month). Unbounded. */
export const monthOffsetFromDate = (anchor: Date, date: Date): number =>
  (date.getFullYear() - anchor.getFullYear()) * 12 +
  (date.getMonth() - anchor.getMonth());

/** Week offset from anchor week (0 = week containing anchor). Unbounded. */
export const weekOffsetFromDate = (anchor: Date, date: Date): number => {
  const anchorMonday = getWeekStartMonday(anchor);
  const targetMonday = getWeekStartMonday(date);
  return Math.round(
    (targetMonday.getTime() - anchorMonday.getTime()) / (DAY_MS * WEEK_LENGTH),
  );
};
