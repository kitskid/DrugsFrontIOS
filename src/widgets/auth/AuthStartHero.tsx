import {useEffect} from 'react';
import {Image, StyleSheet, Text, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
const TWO_PI = Math.PI * 2;
const backgroundGradientStart = {x: 0, y: 1};
const backgroundGradientEnd = {x: 1, y: 0};

type AuthStartHeroProps = {
  topInset: number;
  name?: string | null;
};

export const AuthStartHero = ({topInset, name}: AuthStartHeroProps) => {
  const hasName = typeof name === 'string' && name.trim().length > 0;
  const leftBlobProgress = useSharedValue(0);
  const rightTopBlobProgress = useSharedValue(0);
  const rightBottomBlobProgress = useSharedValue(0);

  useEffect(() => {
    leftBlobProgress.value = withRepeat(
      withTiming(TWO_PI, {
        duration: 8000,
        easing: Easing.linear,
      }),
      -1,
      false,
    );

    rightTopBlobProgress.value = withRepeat(
      withTiming(TWO_PI, {
        duration: 9000,
        easing: Easing.linear,
      }),
      -1,
      false,
    );

    rightBottomBlobProgress.value = withRepeat(
      withTiming(TWO_PI, {
        duration: 10000,
        easing: Easing.linear,
      }),
      -1,
      false,
    );
  }, [leftBlobProgress, rightBottomBlobProgress, rightTopBlobProgress]);

  const leftBlobStyle = useAnimatedStyle(() => ({
    transform: [
      {translateX: Math.cos(leftBlobProgress.value) * 36},
      {translateY: Math.sin(leftBlobProgress.value) * 30},
      {scale: 1 + Math.sin(leftBlobProgress.value * 1.2) * 0.06},
      {rotate: '6deg'},
    ],
  }));

  const rightTopBlobStyle = useAnimatedStyle(() => ({
    transform: [
      {translateX: Math.cos(rightTopBlobProgress.value + 1.2) * 34},
      {translateY: Math.sin(rightTopBlobProgress.value + 1.2) * 28},
      {scale: 1 + Math.sin((rightTopBlobProgress.value + 1.2) * 1.1) * 0.05},
      {rotate: '-9deg'},
    ],
  }));

  const rightBottomBlobStyle = useAnimatedStyle(() => ({
    transform: [
      {translateX: Math.cos(rightBottomBlobProgress.value + 2.1) * 40},
      {translateY: Math.sin(rightBottomBlobProgress.value + 2.1) * 34},
      {scale: 1 + Math.sin((rightBottomBlobProgress.value + 2.1) * 1.15) * 0.06},
      {rotate: '5deg'},
    ],
  }));

  return (
    <View style={[styles.container, {paddingTop: topInset}]}>
      <LinearGradient
        colors={['rgba(122, 63, 216, 1)', 'rgba(77, 172, 255, 1)']}
        start={backgroundGradientStart}
        end={backgroundGradientEnd}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View style={[styles.leftTopBlob, leftBlobStyle]}>
        <Image
          source={require('../../../assets/images/blobs/topLeftBlob.png')}
          style={styles.leftTopBlobImage}
        />
      </Animated.View>

      <Animated.View style={[styles.rightTopBlob, rightTopBlobStyle]}>
        <Image
          source={require('../../../assets/images/blobs/topRightBlob.png')}
          style={styles.rightTopBlobImage}
        />
      </Animated.View>

      <Animated.View style={[styles.rightBottomBlob, rightBottomBlobStyle]}>
        <Image
          source={require('../../../assets/images/blobs/bottomRightBlob.png')}
          style={styles.rightBottomBlobImage}
        />
      </Animated.View>

      <View style={styles.logoWrap}>
        <Image source={require('../../../assets/images/logoLargeOutline.png')} style={styles.logo} />
        {hasName ? (
          <View style={styles.nameContainer}>
            <Text style={styles.nameText}>{`Здравствуйте, ${name?.trim()}`}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  logoWrap: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  logo: {
    width: 200,
    height: 164,
  },
  nameContainer: {
    marginTop: 64,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 32,
    paddingVertical: 20,
    borderRadius: 1000,
  },
  nameText: {
    color: 'rgba(255, 255, 255, 1)',
    fontWeight: '500',
    fontSize: 18,
  },
  leftTopBlob: {
    position: 'absolute',
    left: -60,
    top: -40,
    zIndex: 1,
  },
  leftTopBlobImage: {
    width: 332,
    height: 540,
    resizeMode: 'contain',
  },
  rightTopBlobImage: {
    width: 260,
    height: 384,
    resizeMode: 'contain',
  },
  rightBottomBlobImage: {
    width: 375,
    height: 669,
    resizeMode: 'contain',
  },
  rightTopBlob: {
    position: 'absolute',
    right: -60,
    top: -30,
    zIndex: 1,
  },
  rightBottomBlob: {
    position: 'absolute',
    right: -80,
    bottom: -260,
    zIndex: 1,
  },
});
