import {memo, StyleSheet, Text, View} from 'react-native';

import FolderIcon from '../../../../assets/icons/folder.svg';
import {
  type DrugsCardBackgroundImage,
  getDrugsCardBackgroundIcon,
  getDrugsCardWhiteBackgroundIcon,
} from './drugsCardBackgroundIconRegistry.ts';

export type DrugsCardIconSize = 48 | 36 | 28;

const TEXT_SIZE_BY_ICON_SIZE: Record<DrugsCardIconSize, number> = {
  48: 14,
  36: 12,
  28: 10,
};

type DrugsCardIconNameMapperProps = {
  backgroundImage: DrugsCardBackgroundImage;
  medicationName: string;
  size?: DrugsCardIconSize;
  isFolder?: boolean;
  isWhiteBG?: boolean;
};

const FOLDER_CONTAINER_SIZE = 48;
const FOLDER_ICON_WIDTH = 36;
const FOLDER_ICON_HEIGHT = 30;
const FOLDER_DRUG_ICON_SIZE: DrugsCardIconSize = 36;

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

const DrugsCardIconNameMapperBase = ({
  backgroundImage,
  medicationName,
  size = 36,
  isFolder = false,
  isWhiteBG = false,
}: DrugsCardIconNameMapperProps) => {
  const {color, form, reverse} = backgroundImage;
  const IconComponent = getDrugsCardBackgroundIcon(backgroundImage);
  const WhiteBackgroundComponent = isWhiteBG
    ? getDrugsCardWhiteBackgroundIcon(form, reverse)
    : null;
  const textColor =
    TEXT_COLOR_BY_BACKGROUND_COLOR[color] ?? TEXT_COLOR_BY_BACKGROUND_COLOR[0];
  const drugNameInitials = medicationName.trim().slice(0, 2).toUpperCase() || '--';
  const iconSize = isFolder ? FOLDER_DRUG_ICON_SIZE : size;
  const textSize = TEXT_SIZE_BY_ICON_SIZE[iconSize];

  const drugIcon = (
    <View style={[styles.container, {width: iconSize, height: iconSize}]}>
      {WhiteBackgroundComponent ? (
        <WhiteBackgroundComponent
          width={iconSize}
          height={iconSize}
          style={[styles.layer, styles.whiteBackgroundLayer]}
        />
      ) : null}
      <IconComponent
        width={iconSize}
        height={iconSize}
        style={[styles.layer, styles.iconLayer]}
      />
      <View style={[styles.layer, styles.textLayer]} pointerEvents="none">
        <Text style={[styles.text, {color: textColor, fontSize: textSize}]}>
          {drugNameInitials}
        </Text>
      </View>
    </View>
  );

  if (isFolder) {
    return (
      <View
        style={[
          styles.folderContainer,
          {width: FOLDER_CONTAINER_SIZE, height: FOLDER_CONTAINER_SIZE},
        ]}>
        <View style={styles.folderIconPosition}>
          <FolderIcon width={FOLDER_ICON_WIDTH} height={FOLDER_ICON_HEIGHT} />
        </View>
        <View style={styles.drugIconPosition}>{drugIcon}</View>
      </View>
    );
  }

  return drugIcon;
};

export const DrugsCardIconNameMapper = memo(DrugsCardIconNameMapperBase);

const styles = StyleSheet.create({
  folderContainer: {
    position: 'relative',
  },
  folderIconPosition: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  drugIconPosition: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  container: {
    position: 'relative',
  },
  layer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  whiteBackgroundLayer: {
    zIndex: 0,
  },
  iconLayer: {
    zIndex: 1,
  },
  textLayer: {
    zIndex: 2,
  },
  text: {
    textAlign: 'center',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});
