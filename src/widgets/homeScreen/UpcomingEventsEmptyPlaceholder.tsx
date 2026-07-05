import {StyleSheet, Text, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import {useTranslation} from 'react-i18next';

import type {TabsStackParamList} from '../../app/TabsStack.tsx';
import i18n from '../../features/localisation/i18n.ts';
import {TouchableTextIsIcon} from '../../shared/ui/TouchableTextIsIcon.tsx';
import {UpcomingEventsBlockSkeleton} from './UpcomingEventsBlockSkeleton.tsx';

type UpcomingEventsBlockHeaderProps = {
  style?: object;
};

export const UpcomingEventsBlockHeader = ({style}: UpcomingEventsBlockHeaderProps) => {
  const {t} = useTranslation('home', {i18n});
  const navigation = useNavigation<BottomTabNavigationProp<TabsStackParamList>>();

  return (
    <View style={[styles.headerRow, style]}>
      <Text style={styles.title}>{t('upcomingEvents.title')}</Text>
      <TouchableTextIsIcon
        text={t('upcomingEvents.goToCalendar')}
        onPress={() => {
          navigation.navigate('CalendarTab');
        }}
      />
    </View>
  );
};

export const UpcomingEventsEmptyPlaceholder = () => (
  <View style={styles.block}>
    <UpcomingEventsBlockHeader style={styles.headerGap} />
    <UpcomingEventsBlockSkeleton animated={false} />
  </View>
);

const styles = StyleSheet.create({
  block: {
    marginTop: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  headerGap: {
    marginBottom: 20,
  },
  title: {
    color: 'rgba(134, 132, 168, 1)',
  },
});
