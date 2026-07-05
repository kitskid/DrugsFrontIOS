import {StyleSheet, Text, View} from 'react-native';

import {DrugsCardIconNameMapper} from '../../shared/ui/drugsCard/DrugsCardIconNameMapper.tsx';

type CalendarCardBackgroundImage = {
  form: number;
  reverse: number;
  color: number;
  gradientDirection: number;
};

type CalendarCardItem = {
  id: string;
  medicationName: string;
  notes: string | null;
  intakeTimes: readonly string[];
  backgroundImage: CalendarCardBackgroundImage;
};

type CalendarCardProps = {
  item: CalendarCardItem;
};

export const CalendarCard = ({item}: CalendarCardProps) => {
  const eventTime = item.intakeTimes[0] ?? '--:--';

  return (
    <View style={styles.container}>
      <Text style={styles.time}>{eventTime}</Text>
      <View style={styles.divider} />
      <View style={styles.textContainer}>
        <Text style={styles.status}>Принято</Text>
        <Text
          numberOfLines={2}
          ellipsizeMode="tail"
          style={styles.medicationName}>
          {item.medicationName}
        </Text>
        {item.notes ? (
          <Text numberOfLines={2} ellipsizeMode="tail" style={styles.notes}>
            {item.notes}
          </Text>
        ) : null}
      </View>
      <View style={styles.iconContainer}>
        <DrugsCardIconNameMapper
          backgroundImage={item.backgroundImage}
          medicationName={item.medicationName}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingVertical: 12,
  },
  time: {
    marginLeft: 20,
    marginRight: 18,
    alignSelf: 'center',
    color: 'rgba(134, 132, 168, 1)',
    fontWeight: '500',
    fontSize: 16,
  },
  divider: {
    width: 1,
    backgroundColor: 'rgba(241, 240, 249, 1)',
  },
  textContainer: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },
  status: {
    color: 'rgba(116, 183, 0, 1)',
  },
  medicationName: {
    marginTop: 4,
    color: 'rgba(29, 26, 73, 1)',
    fontWeight: '500',
    fontSize: 16,
  },
  notes: {
    marginTop: 4,
    color: 'rgba(134, 132, 168, 1)',
  },
  iconContainer: {
    marginLeft: 10,
    marginRight: 12,
    justifyContent: 'center',
  },
});
