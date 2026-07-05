import {useQuery} from '@tanstack/react-query';

import {apiProfile} from '../apiProfile.ts';
import {MEAL_SCHEDULE_QUERY_KEY} from './types.ts';

export const useMealScheduleQuery = () =>
  useQuery({
    queryKey: MEAL_SCHEDULE_QUERY_KEY,
    queryFn: async () => {
      const response = await apiProfile.meals.getMe();
      return response.data;
    },
  });
