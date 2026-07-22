import {forwardRef, useEffect, useImperativeHandle, useRef, type ReactNode} from 'react';
import {
  BackHandler,
  Keyboard,
  Platform,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
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
      onChange,
      ...props
    },
    ref,
  ) => {
    const insets = useSafeAreaInsets();
    const sheetRef = useRef<BottomSheetModal>(null);
    const isPresentedRef = useRef(false);
    const backHandlerSubscriptionRef = useRef<{remove: () => void} | null>(null);

    useImperativeHandle(ref, () => sheetRef.current as BottomSheetModal, []);

    useEffect(() => {
      return () => {
        backHandlerSubscriptionRef.current?.remove();
        backHandlerSubscriptionRef.current = null;
      };
    }, []);

    const syncAndroidBackHandler = (isPresented: boolean) => {
      if (Platform.OS !== 'android') {
        return;
      }

      if (isPresented && !backHandlerSubscriptionRef.current) {
        backHandlerSubscriptionRef.current = BackHandler.addEventListener(
          'hardwareBackPress',
          () => {
            if (!isPresentedRef.current) {
              return false;
            }

            if (Keyboard.isVisible()) {
              Keyboard.dismiss();
              return true;
            }

            sheetRef.current?.dismiss();
            return true;
          },
        );
        return;
      }

      if (!isPresented && backHandlerSubscriptionRef.current) {
        backHandlerSubscriptionRef.current.remove();
        backHandlerSubscriptionRef.current = null;
      }
    };

    return (
      <BottomSheetModal
        ref={sheetRef}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        handleIndicatorStyle={styles.handleIndicator}
        backgroundStyle={styles.background}
        {...props}
        enablePanDownToClose={props.enablePanDownToClose ?? true}
        backdropComponent={props.backdropComponent ?? backdropComponent}
        onChange={(index, position, type) => {
          const isPresented = index >= 0;
          isPresentedRef.current = isPresented;
          syncAndroidBackHandler(isPresented);
          onChange?.(index, position, type);
        }}>
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
