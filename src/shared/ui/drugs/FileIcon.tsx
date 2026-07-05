import {StyleSheet, View} from 'react-native';
import Svg, {Defs, LinearGradient, Path, Stop} from 'react-native-svg';

import {IconMapper, type IconName} from '../IconMapper.tsx';

const FILE_BG_WIDTH = 33;
const FILE_BG_HEIGHT = 42;
const ICON_CONTAINER_SIZE = 48;
const CENTER_ICON_SIZE = 24;
const CENTER_ICON_WEIGHT = 1.5;

type GradientStop = {
  color: string;
  opacity: number;
};

type FileTypeConfig = {
  icon: IconName;
  iconColor: string;
  gradientStart: GradientStop;
  gradientEnd: GradientStop;
};

const DEFAULT_FILE_TYPE_CONFIG: FileTypeConfig = {
  icon: 'file',
  iconColor: 'rgba(162, 160, 191, 1)',
  gradientStart: {color: '#8684A8', opacity: 0.05},
  gradientEnd: {color: '#8684A8', opacity: 0.4},
};

const FILE_TYPE_CONFIG: Record<string, FileTypeConfig> = {
  pdf: {
    icon: 'file-type-pdf',
    iconColor: 'rgba(245, 33, 33, 1)',
    gradientStart: {color: '#F52121', opacity: 0},
    gradientEnd: {color: '#F52121', opacity: 0.4},
  },
  docx: {
    icon: 'file-type-docx',
    iconColor: 'rgba(35, 142, 235, 1)',
    gradientStart: {color: '#238EEB', opacity: 0},
    gradientEnd: {color: '#238EEB', opacity: 0.4},
  },
  doc: {
    icon: 'file-type-doc',
    iconColor: 'rgba(35, 142, 235, 1)',
    gradientStart: {color: '#238EEB', opacity: 0},
    gradientEnd: {color: '#238EEB', opacity: 0.4},
  },
  jpg: {
    icon: 'file-type-jpg',
    iconColor: 'rgba(255, 128, 0, 1)',
    gradientStart: {color: '#FF8000', opacity: 0.05},
    gradientEnd: {color: '#FF8000', opacity: 0.4},
  },
  txt: {
    icon: 'file-type-txt',
    iconColor: 'rgba(162, 160, 191, 1)',
    gradientStart: {color: '#8684A8', opacity: 0.05},
    gradientEnd: {color: '#8684A8', opacity: 0.4},
  },
  png: {
    icon: 'file-type-png',
    iconColor: 'rgba(0, 135, 112, 1)',
    gradientStart: {color: '#00BE9E', opacity: 0.05},
    gradientEnd: {color: '#00BE9E', opacity: 0.4},
  },
  zip: {
    icon: 'file-type-zip',
    iconColor: 'rgba(196, 134, 0, 1)',
    gradientStart: {color: '#FFCC00', opacity: 0.15},
    gradientEnd: {color: '#FFCC00', opacity: 0.55},
  },
};

const getFileTypeConfig = (fileType: string): FileTypeConfig =>
  FILE_TYPE_CONFIG[fileType.toLowerCase()] ?? DEFAULT_FILE_TYPE_CONFIG;

type FileIconProps = {
  fileType: string;
  id?: string;
};

export const FileIcon = ({fileType, id = 'default'}: FileIconProps) => {
  const {icon, iconColor, gradientStart, gradientEnd} = getFileTypeConfig(fileType);
  const gradientId = `file-gradient-${id.replace(/[^a-zA-Z0-9_-]/g, '')}`;

  return (
    <View style={styles.iconContainer}>
      <Svg width={FILE_BG_WIDTH} height={FILE_BG_HEIGHT} viewBox="0 0 33 42">
        <Defs>
          <LinearGradient
            id={gradientId}
            x1={33}
            y1={0}
            x2={-7.80757}
            y2={32.0631}
            gradientUnits="userSpaceOnUse">
            <Stop
              offset={0}
              stopColor={gradientStart.color}
              stopOpacity={gradientStart.opacity}
            />
            <Stop
              offset={1}
              stopColor={gradientEnd.color}
              stopOpacity={gradientEnd.opacity}
            />
          </LinearGradient>
        </Defs>
        <Path
          d="M17.6744 0H8C3.58172 0 0 3.58172 0 8V34C0 38.4183 3.58172 42 8 42H25C29.4183 42 33 38.4183 33 34V14.7652C33 12.5331 32.0674 10.4024 30.4276 8.88801L23.1019 2.1228C21.624 0.75794 19.6861 0 17.6744 0Z"
          fill={`url(#${gradientId})`}
        />
      </Svg>
      <View style={styles.centerIcon}>
        <IconMapper
          icon={icon}
          size={CENTER_ICON_SIZE}
          color={iconColor}
          weight={CENTER_ICON_WEIGHT}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    width: ICON_CONTAINER_SIZE,
    height: ICON_CONTAINER_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerIcon: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
