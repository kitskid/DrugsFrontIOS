import {useEffect} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import Animated, {
    FadeIn,
    FadeOut,
    LinearTransition,
    useAnimatedStyle,
    useSharedValue,
    withTiming
} from 'react-native-reanimated';

import i18n from '../../../features/localisation/i18n';
import {ActiveButton} from '../../../shared/ui/ActiveButton.tsx';
import {EveryHourPickerMain} from '../../../shared/ui/timePickers/EveryHourPickerMain.tsx';
import {TimePickerMain} from "../../../shared/ui/timePickers/TimePickerMain.tsx";
import {Switch} from '../../../shared/ui/Switch.tsx';

type IntervalPreset = {
    key: '2' | '4' | '6' | '8' | '12' | 'custom';
    hours: number;
    isCustom?: boolean;
};

export const EVERY_HOUR_PRESETS: IntervalPreset[] = [
    {key: '2', hours: 2},
    {key: '4', hours: 4},
    {key: '6', hours: 6},
    {key: '8', hours: 8},
    {key: '12', hours: 12},
    {key: 'custom', hours: 24, isCustom: true},
];

export const resolveEveryHourPreset = (key: string) =>
    EVERY_HOUR_PRESETS.find(preset => preset.key === key) ?? EVERY_HOUR_PRESETS[0];

type RegimentEveryHourContentProps = {
    everyHourSelectedPresetKey: string;
    everyHourCustomHoursValue: string;
    everyHourStartPauseTime: string;
    everyHourEndPauseTime: string;
    everyHourIsIntervalSwitchActive: boolean;
    onEveryHourPresetChange: (presetKey: string, presetHours: number) => void;
    onEveryHourCustomHoursValueChange: (value: string) => void;
    onEveryHourStartPauseTimeChange: (value: string) => void;
    onEveryHourEndPauseTimeChange: (value: string) => void;
    onEveryHourIntervalSwitchActiveChange: (value: boolean) => void;
};

export const RegimentEveryHourContent = ({
    everyHourSelectedPresetKey,
    everyHourCustomHoursValue,
    everyHourStartPauseTime,
    everyHourEndPauseTime,
    everyHourIsIntervalSwitchActive,
    onEveryHourPresetChange,
    onEveryHourCustomHoursValueChange,
    onEveryHourStartPauseTimeChange,
    onEveryHourEndPauseTimeChange,
    onEveryHourIntervalSwitchActiveChange,
}: RegimentEveryHourContentProps) => {
    const {t} = useTranslation('drugsCreate', {i18n});
    const pauseRowProgress = useSharedValue(everyHourIsIntervalSwitchActive ? 1 : 0);
    const selectedPreset = resolveEveryHourPreset(everyHourSelectedPresetKey);
    const isCustomSelected = Boolean(selectedPreset.isCustom);

    useEffect(() => {
        pauseRowProgress.value = withTiming(everyHourIsIntervalSwitchActive ? 1 : 0, {duration: 180});
    }, [everyHourIsIntervalSwitchActive, pauseRowProgress]);

    const dateTimeRowAnimatedStyle = useAnimatedStyle(() => ({
        opacity: pauseRowProgress.value * 0.55 + 0.45,
    }));

    return (<>
        <Animated.View style={styles.card} layout={LinearTransition.duration(180)}>
            <Text style={styles.title}>{t('regimenTypes.everyHour.intervalTitle')}</Text>

            <View style={styles.intervalsWrap}>
                {EVERY_HOUR_PRESETS.map(preset => (
                    <ActiveButton
                        key={preset.key}
                        label={t(`regimenTypes.everyHour.presets.${preset.key}`)}
                        isActive={preset.key === everyHourSelectedPresetKey}
                        onPress={() => {
                            onEveryHourPresetChange(preset.key, preset.hours);
                        }}
                    />
                ))}
            </View>

            <Animated.View layout={LinearTransition.duration(180)}>
                {isCustomSelected ? (
                    <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(120)}
                                   style={styles.customFieldWrap}>
                        <EveryHourPickerMain
                            label={t('regimenTypes.everyHour.everyLabel')}
                            modalTitle={t('regimenTypes.everyHour.everyLabel')}
                            value={everyHourCustomHoursValue}
                            onChange={onEveryHourCustomHoursValueChange}
                        />
                    </Animated.View>
                ) : null}
            </Animated.View>
        </Animated.View>
        <Animated.View style={styles.card} layout={LinearTransition.duration(180)}>
            <View style={styles.titleRow}>
                <Text style={styles.titleInRow}>{t('regimenTypes.everyHour.pauseTitle')}</Text>
                <Switch
                    isActive={everyHourIsIntervalSwitchActive}
                    setIsActive={onEveryHourIntervalSwitchActiveChange}
                />
            </View>
            <View pointerEvents={everyHourIsIntervalSwitchActive ? 'auto' : 'none'}>
                <Animated.View style={[styles.dateTimeRow, dateTimeRowAnimatedStyle]}>
                    <TimePickerMain
                        label={t('regimenTypes.everyHour.fromLabel')}
                        modalTitle={t('regimenTypes.everyHour.fromModalTitle')}
                        value={everyHourStartPauseTime}
                        onChange={onEveryHourStartPauseTimeChange}
                        style={styles.timeField}
                    />
                    <TimePickerMain
                        label={t('regimenTypes.everyHour.toLabel')}
                        modalTitle={t('regimenTypes.everyHour.toModalTitle')}
                        value={everyHourEndPauseTime}
                        onChange={onEveryHourEndPauseTimeChange}
                        style={styles.timeField}
                    />
                </Animated.View>
            </View>
        </Animated.View>
    </>);
};

const styles = StyleSheet.create({
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
    intervalsWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        columnGap: 12,
        rowGap: 16,
    },
    customFieldWrap: {
        marginTop: 20,
    },
    dateTimeRow: {
        flexDirection: 'row',
        gap: 14,
    },
    timeField: {
        flex: 1,
    },
});
