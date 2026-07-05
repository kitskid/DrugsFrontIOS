import {type ReactNode} from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {Skeleton} from '../../shared/ui/Skeleton.tsx';

const TABS_TOP_MARGIN = 12;
const SAVE_BUTTON_BOTTOM_OFFSET = 16;
const SAVE_BUTTON_HEIGHT = 48;
const SAVE_BUTTON_TOP_SPACING = 12;

type SkeletonRowProps = {
  withTitle?: boolean;
};

const SkeletonRow = ({withTitle = false}: SkeletonRowProps) => (
  <View style={styles.row}>
    <View style={styles.rowText}>
      {withTitle ? (
        <>
          <Skeleton width="32%" height={14} borderRadius={6} />
          <Skeleton width="68%" height={16} borderRadius={6} style={styles.rowValue} />
        </>
      ) : (
        <Skeleton width="48%" height={18} borderRadius={6} />
      )}
    </View>
    <Skeleton width={24} height={24} borderRadius={12} />
  </View>
);

const SkeletonCard = ({children}: {children: ReactNode}) => (
  <View style={styles.card}>{children}</View>
);

const SkeletonDivider = () => <View style={styles.divider} />;

export const DrugsCreateSkeleton = () => {
  const insets = useSafeAreaInsets();
  const saveButtonBottom = insets.bottom + SAVE_BUTTON_BOTTOM_OFFSET;
  const scrollBottomPadding =
    insets.bottom + SAVE_BUTTON_BOTTOM_OFFSET + SAVE_BUTTON_HEIGHT + SAVE_BUTTON_TOP_SPACING;

  return (
    <View style={styles.screenContent}>
      <View style={styles.tabsContainer}>
        <Skeleton width="100%" height={50} borderRadius={1000} />
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, {paddingBottom: scrollBottomPadding}]}
        showsVerticalScrollIndicator={false}>
        <SkeletonCard>
          <SkeletonRow />
          <SkeletonDivider />
          <SkeletonRow withTitle />
          <SkeletonDivider />
          <SkeletonRow withTitle />
        </SkeletonCard>
        <SkeletonCard>
          <SkeletonRow withTitle />
        </SkeletonCard>
        <SkeletonCard>
          <View style={styles.switchRow}>
            <Skeleton width={24} height={24} borderRadius={12} />
            <Skeleton width="42%" height={16} borderRadius={6} style={styles.switchLabel} />
            <Skeleton width={44} height={28} borderRadius={1000} />
          </View>
          <SkeletonDivider />
          <SkeletonRow withTitle />
        </SkeletonCard>
      </ScrollView>
      <Skeleton
        width="100%"
        height={SAVE_BUTTON_HEIGHT}
        borderRadius={1000}
        style={[styles.saveButton, {bottom: saveButtonBottom}]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screenContent: {
    flex: 1,
  },
  tabsContainer: {
    marginHorizontal: 12,
    marginTop: TABS_TOP_MARGIN,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 12,
    gap: 16,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 1)',
    borderRadius: 28,
    overflow: 'hidden',
  },
  row: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  rowText: {
    flex: 1,
    marginRight: 12,
  },
  rowValue: {
    marginTop: 6,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(241, 240, 249, 1)',
    marginHorizontal: 20,
  },
  switchRow: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  switchLabel: {
    flex: 1,
    marginLeft: 12,
  },
  saveButton: {
    position: 'absolute',
    left: 12,
    right: 12,
  },
});
