import {useEffect, useState} from 'react';
import {ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {DrugsCreateStackParamList} from '../../features/navigation/DrugsCreateStack';
import i18n from '../../features/localisation/i18n';
import {
  saveNotificationsDraft,
} from '../../features/redux/drugsCreate/drugsCreateSlice';
import type {
  NotificationCustomOffsetUnit,
  NotificationPresetKey,
} from '../../features/redux/drugsCreate/types';
import {useAppDispatch, useAppSelector} from '../../features/redux/hooks';
import {ButtonMain} from '../../shared/ui/ButtonMain';
import {Header} from '../../shared/ui/Header';
import {StatusBarAvoidContainer} from '../../shared/ui/StatusBarAvoidContainer';
import {Switch} from '../../shared/ui/Switch';
import {TimePickerNotify} from '../../shared/ui/timePickers/TimePickerNotify';
import {TimePickerMain} from '../../shared/ui/timePickers/TimePickerMain';

const REMINDER_PRESETS: NotificationPresetKey[] = ['5m', '15m', '30m', '1h', '1d', 'custom'];
const DEFAULT_CUSTOM_OFFSET_AMOUNT = 2;
const DEFAULT_CUSTOM_OFFSET_UNIT: NotificationCustomOffsetUnit = 'hour';
const SAVE_BUTTON_BOTTOM_OFFSET = 16;
const SAVE_BUTTON_HEIGHT = 48;
const SAVE_BUTTON_TOP_SPACING = 12;
const CUSTOM_BG = 'rgba(35, 142, 235, 1)';
const DEFAULT_BG = 'rgba(241, 240, 249, 1)';
const CUSTOM_TEXT = 'rgba(255, 255, 255, 1)';
const DEFAULT_TEXT = 'rgba(29, 26, 73, 1)';

type PresetButtonProps = {
  label: string;
  isActive: boolean;
  onPress: () => void;
};

const resolvePresetByCustomOffset = (
  amount: number,
  unit: NotificationCustomOffsetUnit,
): Exclude<NotificationPresetKey, 'custom'> | null => {
  if (unit === 'minute' && amount === 5) {
    return '5m';
  }
  if (unit === 'minute' && amount === 15) {
    return '15m';
  }
  if (unit === 'minute' && amount === 30) {
    return '30m';
  }
  if (unit === 'hour' && amount === 1) {
    return '1h';
  }
  if (unit === 'day' && amount === 1) {
    return '1d';
  }

  return null;
};

const PresetButton = ({label, isActive, onPress}: PresetButtonProps) => {
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
      <View style={[styles.presetButton, isActive ? styles.presetButtonActive : styles.presetButtonInactive]}>
        <Text style={[styles.presetButtonText, isActive ? styles.presetButtonTextActive : styles.presetButtonTextInactive]}>
          {label}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export const DrugsCreateNotifyScreen = () => {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const navigation = useNavigation<NativeStackNavigationProp<DrugsCreateStackParamList>>();
  const {t} = useTranslation('drugsCreate', {i18n});
  const notifications = useAppSelector(state => state.drugsCreate.notifications);
  const [selectedPresetKeys, setSelectedPresetKeys] = useState<NotificationPresetKey[]>(
    notifications.selectedPresetKeys,
  );
  const [customOffsetAmount, setCustomOffsetAmount] = useState(notifications.customOffsetAmount);
  const [customOffsetUnit, setCustomOffsetUnit] = useState<NotificationCustomOffsetUnit>(notifications.customOffsetUnit);
  const [isDoNotDisturbEnabled, setIsDoNotDisturbEnabled] = useState(notifications.isDoNotDisturbEnabled);
  const [doNotDisturbFrom, setDoNotDisturbFrom] = useState(notifications.doNotDisturbFrom);
  const [doNotDisturbTo, setDoNotDisturbTo] = useState(notifications.doNotDisturbTo);
  const hasCustomPreset = selectedPresetKeys.includes('custom');
  const doNotDisturbProgress = useSharedValue(isDoNotDisturbEnabled ? 1 : 0);
  const scrollBottomPadding = insets.bottom + SAVE_BUTTON_BOTTOM_OFFSET + SAVE_BUTTON_HEIGHT + SAVE_BUTTON_TOP_SPACING;

  useEffect(() => {
    doNotDisturbProgress.value = withTiming(isDoNotDisturbEnabled ? 1 : 0, {duration: 180});
  }, [doNotDisturbProgress, isDoNotDisturbEnabled]);

  const doNotDisturbTimeRowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: doNotDisturbProgress.value * 0.55 + 0.45,
  }));

  const togglePreset = (presetKey: NotificationPresetKey) => {
    setSelectedPresetKeys(prev =>
      prev.includes(presetKey) ? prev.filter(key => key !== presetKey) : [...prev, presetKey],
    );
  };

  return (
    <StatusBarAvoidContainer backgroundColor="rgba(247, 246, 251, 1)">
      <Header title={t('screenTitles.notify')} backgroundColor={'rgba(247, 246, 251, 1)'} />
      <View style={styles.screenContent}>
        <ScrollView
          contentContainerStyle={[
            styles.content,
            {paddingBottom: scrollBottomPadding},
          ]}
          showsVerticalScrollIndicator={false}>
          <Animated.View style={styles.card} layout={LinearTransition.duration(180)}>
            <Text style={styles.title}>{t('notifications.presetsTitle')}</Text>
            <View style={styles.presetsWrap}>
              {REMINDER_PRESETS.map(presetKey => (
                <PresetButton
                  key={presetKey}
                  label={t(`notifications.presets.${presetKey}`)}
                  isActive={selectedPresetKeys.includes(presetKey)}
                  onPress={() => togglePreset(presetKey)}
                />
              ))}
            </View>
            <Animated.View layout={LinearTransition.duration(180)}>
              {hasCustomPreset ? (
                <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(120)} style={styles.customOffsetField}>
                  <TimePickerNotify
                    label={t('notifications.customOffsetLabel')}
                    modalTitle={t('notifications.customOffsetLabel')}
                    valueAmount={customOffsetAmount}
                    valueUnit={customOffsetUnit}
                    onChange={(amount, unit) => {
                      const matchedPreset = resolvePresetByCustomOffset(amount, unit);
                      if (!matchedPreset) {
                        setCustomOffsetAmount(amount);
                        setCustomOffsetUnit(unit);
                        return;
                      }

                      setCustomOffsetAmount(DEFAULT_CUSTOM_OFFSET_AMOUNT);
                      setCustomOffsetUnit(DEFAULT_CUSTOM_OFFSET_UNIT);
                      setSelectedPresetKeys(prev => {
                        const withoutCustom = prev.filter(key => key !== 'custom');
                        if (withoutCustom.includes(matchedPreset)) {
                          return withoutCustom;
                        }
                        return [...withoutCustom, matchedPreset];
                      });
                    }}
                  />
                </Animated.View>
              ) : null}
            </Animated.View>
          </Animated.View>

          <Animated.View style={styles.card} layout={LinearTransition.duration(180)}>
            <View style={styles.titleRow}>
              <Text style={styles.titleInRow}>{t('notifications.doNotDisturbTitle')}</Text>
              <Switch isActive={isDoNotDisturbEnabled} setIsActive={setIsDoNotDisturbEnabled} />
            </View>
            <View pointerEvents={isDoNotDisturbEnabled ? 'auto' : 'none'}>
              <Animated.View style={[styles.dateTimeRow, doNotDisturbTimeRowAnimatedStyle]}>
                <TimePickerMain
                  label={t('notifications.fromLabel')}
                  modalTitle={t('notifications.fromModalTitle')}
                  value={doNotDisturbFrom}
                  onChange={setDoNotDisturbFrom}
                  style={styles.timeField}
                />
                <TimePickerMain
                  label={t('notifications.toLabel')}
                  modalTitle={t('notifications.toModalTitle')}
                  value={doNotDisturbTo}
                  onChange={setDoNotDisturbTo}
                  style={styles.timeField}
                />
              </Animated.View>
            </View>
          </Animated.View>
        </ScrollView>
        <ButtonMain
          title={t('notifications.saveButton')}
          onPress={() => {
            dispatch(
              saveNotificationsDraft({
                selectedPresetKeys,
                customOffsetAmount,
                customOffsetUnit,
                isDoNotDisturbEnabled,
                doNotDisturbFrom,
                doNotDisturbTo,
              }),
            );
            navigation.goBack();
          }}
          style={[styles.saveButton, {bottom: insets.bottom + SAVE_BUTTON_BOTTOM_OFFSET}]}
        />
      </View>
    </StatusBarAvoidContainer>
  );
};

const styles = StyleSheet.create({
  screenContent: {
    flex: 1,
  },
  content: {
    marginTop: 12,
    gap: 16,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 1)',
    borderRadius: 28,
    paddingVertical: 20,
    paddingHorizontal: 12,
  },
  title: {
    color: 'rgba(134, 132, 168, 1)',
    marginBottom: 20,
    marginLeft: 16,
  },
  presetsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 12,
    rowGap: 16,
  },
  presetButton: {
    borderRadius: 1000,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  presetButtonInactive: {
    backgroundColor: DEFAULT_BG,
  },
  presetButtonActive: {
    backgroundColor: CUSTOM_BG,
  },
  presetButtonText: {
    color: DEFAULT_TEXT,
  },
  presetButtonTextInactive: {
    color: DEFAULT_TEXT,
  },
  presetButtonTextActive: {
    color: CUSTOM_TEXT,
  },
  customOffsetField: {
    marginTop: 20,
  },
  titleInRow: {
    color: 'rgba(134, 132, 168, 1)',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 14,
  },
  timeField: {
    flex: 1,
  },
  saveButton: {
    position: 'absolute',
    left: 12,
    right: 12,
  },
});
