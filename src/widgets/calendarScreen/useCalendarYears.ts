import {useCallback, useMemo} from 'react';
import {useQueries, useQueryClient} from '@tanstack/react-query';

import {
  apiCalendar,
  CALENDAR_QUERY_KEY,
  type CalendarResponseDto,
} from '../../features/api/apiCalendar.ts';
import {getYearRange} from './mapCalendarData.ts';

export const calendarYearQueryKey = (year: number) =>
  [...CALENDAR_QUERY_KEY, 'year', year] as const;

/** Prefix for invalidating every per-year calendar query at once. */
export const CALENDAR_YEARS_QUERY_PREFIX = [...CALENDAR_QUERY_KEY, 'year'] as const;

export const fetchCalendarYear = async (
  year: number,
): Promise<CalendarResponseDto> => {
  const response = await apiCalendar.getCalendar(getYearRange(year));
  return response.data;
};

export const mergeCalendarDays = (
  ...responses: Array<CalendarResponseDto | undefined>
): CalendarResponseDto['days'] => {
  const merged: CalendarResponseDto['days'] = {};
  for (const response of responses) {
    if (response?.days) {
      Object.assign(merged, response.days);
    }
  }
  return merged;
};

export const usePrefetchCalendarYear = () => {
  const queryClient = useQueryClient();

  return useCallback(
    (year: number) => {
      void queryClient.prefetchQuery({
        queryKey: calendarYearQueryKey(year),
        queryFn: () => fetchCalendarYear(year),
        staleTime: Infinity,
      });
    },
    [queryClient],
  );
};

type UseMergedCalendarYearsOptions = {
  /** Year whose first load drives the loading skeleton (background years are silent). */
  primaryYear: number;
};

export const useMergedCalendarYears = (
  years: number[],
  {primaryYear}: UseMergedCalendarYearsOptions,
) => {
  const uniqueYears = useMemo(
    () => Array.from(new Set(years)).sort((left, right) => left - right),
    [years],
  );

  const queries = useQueries({
    queries: uniqueYears.map(year => ({
      queryKey: calendarYearQueryKey(year),
      queryFn: () => fetchCalendarYear(year),
      staleTime: Infinity,
    })),
  });

  const data = useMemo(() => {
    const loaded = queries
      .map(query => query.data)
      .filter((entry): entry is CalendarResponseDto => entry !== undefined);

    if (loaded.length === 0) {
      return undefined;
    }

    return {days: mergeCalendarDays(...loaded)};
  }, [queries]);

  const primaryIndex = uniqueYears.indexOf(primaryYear);
  const primaryQuery = primaryIndex >= 0 ? queries[primaryIndex] : undefined;

  const isLoading = Boolean(primaryQuery?.isLoading && !primaryQuery?.data);
  const isError = Boolean(primaryQuery?.isError && !primaryQuery?.data);

  return {data, isLoading, isError};
};
