import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useCallback} from 'react';
import {useTranslation} from 'react-i18next';

import type {AppStackParamList} from '../../app/AppStack.tsx';
import {formatMealTimeDisplay, mapMealScheduleToMealItems} from '../../features/api/meals/mealScheduleMappers.ts';
import {useMealScheduleQuery} from '../../features/api/meals/useMealScheduleQuery.ts';
import i18n from '../../features/localisation/i18n.ts';
import {IconMapper} from '../../shared/ui/IconMapper.tsx';

export const ProfileMealsCard = () => {
  const {t} = useTranslation('profile', {i18n});
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const {data: schedule, refetch} = useMealScheduleQuery();

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );

  const meals = mapMealScheduleToMealItems(schedule);

  return (
    <View style={styles.card}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => {
          navigation.navigate('Profile', {
            screen: 'ProfileMeals',
          });
        }}
        style={styles.touchable}>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{t('meals_card_title')}</Text>
          {meals.length > 0 ? (
            <Text style={styles.mealsText}>
              {meals.map((meal, index) => (
                <Text key={meal.id}>
                  {index > 0 ? ' ' : ''}
                  {index > 0 ? <Text style={styles.separator}>| </Text> : null}
                  {formatMealTimeDisplay(meal.time)} {meal.name}
                </Text>
              ))}
            </Text>
          ) : (
            <Text style={styles.emptyText}>{t('meals_not_specified')}</Text>
          )}
        </View>
        <View style={styles.iconContainer}>
          <IconMapper
            icon="chevron-right"
            size={24}
            color="rgba(199, 198, 217, 1)"
            weight={1.5}
          />
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 255, 255, 1)',
    borderRadius: 28,
    marginBottom: 16,
  },
  touchable: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    color: 'rgba(134, 132, 168, 1)',
  },
  mealsText: {
    marginTop: 4,
    color: 'rgba(29, 26, 73, 1)',
    fontSize: 16,
  },
  emptyText: {
    marginTop: 4,
    color: 'rgba(199, 198, 217, 1)',
    fontSize: 16,
  },
  separator: {
    color: 'rgba(199, 198, 217, 1)',
  },
  iconContainer: {
    marginRight: 12,
  },
});
