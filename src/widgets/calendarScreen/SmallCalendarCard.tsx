import {StyleSheet, Text, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import {DrugsCardIconNameMapper} from '../../shared/ui/drugs/DrugsCardIconNameMapper.tsx';

type SmallCalendarCardBackgroundImage = {
  form: number;
  reverse: number;
  color: number;
  gradientDirection: number;
};

type SmallCalendarCardProps = {
  backgroundImage: SmallCalendarCardBackgroundImage;
  medicationName: string;
  maxWidth?: number;
};

const GRADIENT_BY_BACKGROUND_COLOR: Record<number, [string, string]> = {
  0: ['rgba(245, 33, 33, 0)', 'rgba(245, 33, 33, 0.15)'],
  1: ['rgba(255, 128, 0, 0)', 'rgba(255, 128, 0, 0.15)'],
  2: ['rgba(196, 134, 0, 0)', 'rgba(196, 134, 0, 0.15)'],
  3: ['rgba(99, 156, 0, 0)', 'rgba(99, 156, 0, 0.15)'],
  4: ['rgba(0, 135, 112, 0)', 'rgba(0, 135, 112, 0.15)'],
  5: ['rgba(35, 142, 235, 0)', 'rgba(35, 142, 235, 0.15)'],
  6: ['rgba(100, 89, 248, 0)', 'rgba(100, 89, 248, 0.15)'],
  7: ['rgba(194, 29, 183, 0)', 'rgba(194, 29, 183, 0.15)'],
};

const GRADIENT_START = {x: 0, y: 0.5};
const GRADIENT_END = {x: 1, y: 0.5};

export const SmallCalendarCard = ({
  backgroundImage,
  medicationName,
  maxWidth,
}: SmallCalendarCardProps) => {
  const gradientColors =
    GRADIENT_BY_BACKGROUND_COLOR[backgroundImage.color] ??
    GRADIENT_BY_BACKGROUND_COLOR[0];

  return (
    <LinearGradient
      colors={gradientColors}
      start={GRADIENT_START}
      end={GRADIENT_END}
      style={[styles.container, maxWidth != null ? {maxWidth} : null]}>
      <DrugsCardIconNameMapper
        backgroundImage={backgroundImage}
        medicationName={medicationName}
        size={28}
      />
      <Text style={styles.medicationName} numberOfLines={1} ellipsizeMode="tail">
        {medicationName}
      </Text>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 32,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 12,
    borderRadius: 1000,
    overflow: 'hidden',
  },
  medicationName: {
    marginLeft: 4,
    flexShrink: 1,
    color: 'rgba(29, 26, 73, 1)',
  },
});
