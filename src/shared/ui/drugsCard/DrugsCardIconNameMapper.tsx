import {StyleSheet, Text, View} from 'react-native';

import Form9Reverse0Color0GradientDirection0Icon from '../../../../assets/icons/drugsCardsBackground/form=9, reverse=0, color=0, gradientDirection=0.svg';
import Form8Reverse0Color1GradientDirection1Icon from '../../../../assets/icons/drugsCardsBackground/form=8, reverse=0, color=1, gradientDirection=1.svg';
import Form7Reverse0Color2GradientDirection2Icon from '../../../../assets/icons/drugsCardsBackground/form=7, reverse=0, color=2, gradientDirection=2.svg';
import Form6Reverse0Color3GradientDirection3Icon from '../../../../assets/icons/drugsCardsBackground/form=6, reverse=0, color=3, gradientDirection=3.svg';
import Form5Reverse0Color4GradientDirection0Icon from '../../../../assets/icons/drugsCardsBackground/form=5, reverse=0, color=4, gradientDirection=0.svg';
import Form4Reverse0Color5GradientDirection1Icon from '../../../../assets/icons/drugsCardsBackground/form=4, reverse=0, color=5, gradientDirection=1.svg';

type DrugsCardBackgroundImage = {
  form: number;
  reverse: number;
  color: number;
  gradientDirection: number;
};

export type DrugsCardIconSize = 36 | 28;

const TEXT_SIZE_BY_ICON_SIZE: Record<DrugsCardIconSize, number> = {
  36: 12,
  28: 10,
};

type DrugsCardIconNameMapperProps = {
  backgroundImage: DrugsCardBackgroundImage;
  medicationName: string;
  size?: DrugsCardIconSize;
};

const TEXT_COLOR_BY_BACKGROUND_COLOR: Record<number, string> = {
  0: 'rgba(245, 33, 33, 1)',
  1: 'rgba(255, 128, 0, 1)',
  2: 'rgba(196, 134, 0, 1)',
  3: 'rgba(99, 156, 0, 1)',
  4: 'rgba(0, 135, 112, 1)',
  5: 'rgba(35, 142, 235, 1)',
  6: 'rgba(100, 89, 248, 1)',
  7: 'rgba(194, 29, 183, 1)',
};

const iconByBackgroundParams: Record<string, typeof Form9Reverse0Color0GradientDirection0Icon> = {
  'form=9, reverse=0, color=0, gradientDirection=0':
    Form9Reverse0Color0GradientDirection0Icon,
  'form=8, reverse=0, color=1, gradientDirection=1':
    Form8Reverse0Color1GradientDirection1Icon,
  'form=7, reverse=0, color=2, gradientDirection=2':
    Form7Reverse0Color2GradientDirection2Icon,
  'form=6, reverse=0, color=3, gradientDirection=3':
    Form6Reverse0Color3GradientDirection3Icon,
  'form=5, reverse=0, color=4, gradientDirection=0':
    Form5Reverse0Color4GradientDirection0Icon,
  'form=4, reverse=0, color=5, gradientDirection=1':
    Form4Reverse0Color5GradientDirection1Icon,
};

export const DrugsCardIconNameMapper = ({
  backgroundImage,
  medicationName,
  size = 36,
}: DrugsCardIconNameMapperProps) => {
  const {form, reverse, color, gradientDirection} = backgroundImage;
  const iconKey = `form=${form}, reverse=${reverse}, color=${color}, gradientDirection=${gradientDirection}`;
  const IconComponent =
    iconByBackgroundParams[iconKey] ?? Form9Reverse0Color0GradientDirection0Icon;
  const textColor =
    TEXT_COLOR_BY_BACKGROUND_COLOR[color] ?? TEXT_COLOR_BY_BACKGROUND_COLOR[0];
  const drugNameInitials = medicationName.trim().slice(0, 2).toUpperCase() || '--';
  const textSize = TEXT_SIZE_BY_ICON_SIZE[size];

  return (
    <View style={[styles.container, {width: size, height: size}]}>
      <IconComponent width={size} height={size} />
      <Text style={[styles.text, {color: textColor, fontSize: textSize}]}>
        {drugNameInitials}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    position: 'absolute',
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 12,
    textTransform: 'uppercase',
  },
});
