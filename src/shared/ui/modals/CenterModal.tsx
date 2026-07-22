import {forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState, type ReactNode} from 'react';
import {
  BackHandler,
  Keyboard,
  Platform,
  StyleSheet,
  useWindowDimensions,
  View,
  type LayoutChangeEvent,
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

type CenterModalProps = Omit<BottomSheetModalProps, 'children' | 'ref'> & {
  children: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
};

const ESTIMATED_CONTENT_HEIGHT = 120;

const backdropComponent = (props: BottomSheetBackdropProps) => (
  <BottomSheetBackdrop
    {...props}
    appearsOnIndex={0}
    disappearsOnIndex={-1}
    pressBehavior="close"
  />
);

export const CenterModal = forwardRef<BottomSheetModal, CenterModalProps>(
  ({children, contentContainerStyle, onDismiss, onChange, ...props}, ref) => {
    const sheetRef = useRef<BottomSheetModal>(null);
    const isPresentedRef = useRef(false);
    const backHandlerSubscriptionRef = useRef<{remove: () => void} | null>(null);
    const {height: screenHeight} = useWindowDimensions();
    const [bottomInset, setBottomInset] = useState(() =>
      Math.max(0, (screenHeight - ESTIMATED_CONTENT_HEIGHT) / 2),
    );

    useImperativeHandle(ref, () => sheetRef.current as BottomSheetModal, []);

    const updateBottomInset = useCallback(
      (contentHeight: number) => {
        const nextInset = Math.max(0, (screenHeight - contentHeight) / 2);
        setBottomInset(prev => (Math.abs(prev - nextInset) < 1 ? prev : nextInset));
      },
      [screenHeight],
    );

    const handleMeasureLayout = useCallback(
      (event: LayoutChangeEvent) => {
        updateBottomInset(event.nativeEvent.layout.height);
      },
      [updateBottomInset],
    );

    useEffect(() => {
      setBottomInset(Math.max(0, (screenHeight - ESTIMATED_CONTENT_HEIGHT) / 2));
    }, [screenHeight]);

    useEffect(() => {
      if (!isPresentedRef.current) {
        return;
      }

      requestAnimationFrame(() => {
        sheetRef.current?.snapToIndex(0);
      });
    }, [bottomInset]);

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
      <>
        <View pointerEvents="none" style={styles.measurer}>
          <View style={contentContainerStyle} onLayout={handleMeasureLayout}>
            {children}
          </View>
        </View>

        <BottomSheetModal
          ref={sheetRef}
          detached
          enableDynamicSizing
          enablePanDownToClose={false}
          handleComponent={null}
          bottomInset={bottomInset}
          style={styles.sheet}
          backdropComponent={backdropComponent}
          backgroundStyle={styles.background}
          onDismiss={onDismiss}
          {...props}
          onChange={(...args) => {
            const isPresented = args[0] >= 0;
            isPresentedRef.current = isPresented;
            syncAndroidBackHandler(isPresented);
            onChange?.(...args);
          }}>
          <BottomSheetView style={contentContainerStyle}>{children}</BottomSheetView>
        </BottomSheetModal>
      </>
    );
  },
);

const styles = StyleSheet.create({
  measurer: {
    position: 'absolute',
    left: 24,
    right: 24,
    opacity: 0,
    zIndex: -1,
  },
  sheet: {
    marginHorizontal: 12,
  },
  background: {
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 1)',
  },
});
