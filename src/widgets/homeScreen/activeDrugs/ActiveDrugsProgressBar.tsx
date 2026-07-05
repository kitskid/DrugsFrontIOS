import {useCallback, useState} from 'react';
import {LayoutChangeEvent, StyleSheet, Text, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

type ActiveDrugsProgresBarProps = {
  label: string;
  value: string;
  progress: number;
};

const clampProgress = (progress: number): number =>
  Math.min(1, Math.max(0, progress));

export const ActiveDrugsProgressBar = ({
  label,
  value,
  progress,
}: ActiveDrugsProgresBarProps) => {
  const fillProgress = clampProgress(progress);
  const [containerWidth, setContainerWidth] = useState(0);

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    setContainerWidth(event.nativeEvent.layout.width);
  }, []);

  const fillWidth = containerWidth * fillProgress;

  return (
    <View style={styles.container} onLayout={handleLayout}>
      {containerWidth > 0 ? (
        <View style={[styles.fillClip, {width: fillWidth}]} pointerEvents="none">
          <LinearGradient
            colors={['rgba(35, 142, 235, 0)', 'rgba(35, 142, 235, 0.1)']}
            start={{x: 0, y: 0.5}}
            end={{x: 1, y: 0.5}}
            style={[styles.fill, {width: containerWidth}]}
          />
        </View>
      ) : null}
      <Text style={styles.label} numberOfLines={2}>
        {label}
      </Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(35, 142, 235, 0.05)',
    borderRadius: 28,
    paddingVertical: 8,
    paddingHorizontal: 16,
    overflow: 'hidden',
  },
  fillClip: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
  label: {
    flex: 1,
    flexShrink: 1,
    marginRight: 8,
    color: 'rgba(134, 132, 168, 1)',
    fontSize: 13,
    lineHeight: 16,
  },
  value: {
    color: 'rgba(35, 142, 235, 1)',
    fontSize: 16,
    fontWeight: '700',
  },
});
