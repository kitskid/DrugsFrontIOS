import {forwardRef, type ReactNode} from 'react';
import type {StyleProp, ViewStyle} from 'react-native';
import {StyleSheet} from 'react-native';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
  type BottomSheetBackdropProps,
  type BottomSheetModalProps,
} from '@gorhom/bottom-sheet';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

type BottomSheetMainProps = Omit<BottomSheetModalProps, 'children' | 'ref'> & {
  children: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  enableFooterMarginAdjustment?: boolean;
  hasFooter?: boolean;
  scrollable?: boolean;
};

const backdropComponent = (props: BottomSheetBackdropProps) => (
  <BottomSheetBackdrop
    {...props}
    appearsOnIndex={0}
    disappearsOnIndex={-1}
    pressBehavior="close"
  />
);

export const BottomSheetMain = forwardRef<BottomSheetModal, BottomSheetMainProps>(
  (
    {
      children,
      contentContainerStyle,
      enableFooterMarginAdjustment = false,
      hasFooter = false,
      scrollable = false,
      ...props
    },
    ref,
  ) => {
    const insets = useSafeAreaInsets();

    return (
      <BottomSheetModal
        ref={ref}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        handleIndicatorStyle={styles.handleIndicator}
        backgroundStyle={styles.background}
        {...props}
        enablePanDownToClose={props.enablePanDownToClose ?? true}
        backdropComponent={props.backdropComponent ?? backdropComponent}>
        {scrollable ? (
          children
        ) : (
          <BottomSheetView
            enableFooterMarginAdjustment={enableFooterMarginAdjustment}
            style={[
              styles.content,
              !hasFooter && {paddingBottom: 16 + insets.bottom},
              contentContainerStyle,
            ]}>
            {children}
          </BottomSheetView>
        )}
      </BottomSheetModal>
    );
  },
);

const styles = StyleSheet.create({
  background: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  handleIndicator: {
    width: 36,
    backgroundColor: 'rgba(232, 231, 242, 1)',
  },
  content: {
    paddingHorizontal: 12,
  },
});
