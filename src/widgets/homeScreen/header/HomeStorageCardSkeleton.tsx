import {StyleSheet} from 'react-native';
import type {StyleProp, ViewStyle} from 'react-native';

import {Skeleton} from '../../../shared/ui/Skeleton.tsx';

export const HOME_STORAGE_CARD_HEIGHT = 72;

type HomeStorageCardSkeletonProps = {
  style?: StyleProp<ViewStyle>;
};

export const HomeStorageCardSkeleton = ({
  style,
}: HomeStorageCardSkeletonProps) => (
  <Skeleton
    width="100%"
    height={HOME_STORAGE_CARD_HEIGHT}
    borderRadius={28}
    style={[styles.surface, styles.container, style]}
  />
);

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  surface: {
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
});
