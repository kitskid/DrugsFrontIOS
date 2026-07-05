import {useCallback, useEffect, useMemo, useState} from 'react';
import {ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import Animated, {
    FadeIn,
    FadeInDown,
    FadeOut,
    FadeOutUp,
    LinearTransition,
} from 'react-native-reanimated';

import {CircleIconButton} from '../../../shared/ui/CircleIconButton.tsx';
import i18n from '../../../features/localisation/i18n';
import {Switch} from '../../../shared/ui/Switch.tsx';
import {TimePickerMain} from '../../../shared/ui/timePickers/TimePickerMain.tsx';
import {TimePickerModal} from '../../../shared/ui/timePickers/TimePickerModal.tsx';
import {InfoCard} from '../../../shared/ui/InfoCard.tsx';

const ACTIVE_BG = 'rgba(35, 142, 235, 1)';
const DEFAULT_BG = 'rgba(241, 240, 249, 1)';
const ACTIVE_TEXT = 'rgba(255, 255, 255, 1)';
const DEFAULT_TEXT = 'rgba(29, 26, 73, 1)';
const DAY_BUTTONS_GAP = 8;
const DAY_BUTTONS_HORIZONTAL_PADDING = 8;

export const WEEK_DAYS = [
    {key: 0, shortKey: 'mondayShort', titleKey: 'mondayTitle'},
    {key: 1, shortKey: 'tuesdayShort', titleKey: 'tuesdayTitle'},
    {key: 2, shortKey: 'wednesdayShort', titleKey: 'wednesdayTitle'},
    {key: 3, shortKey: 'thursdayShort', titleKey: 'thursdayTitle'},
    {key: 4, shortKey: 'fridayShort', titleKey: 'fridayTitle'},
    {key: 5, shortKey: 'saturdayShort', titleKey: 'saturdayTitle'},
    {key: 6, shortKey: 'sundayShort', titleKey: 'sundayTitle'},
] as const;

export type WeekDayKey = (typeof WEEK_DAYS)[number]['key'];

export type WeekDayTimeItem = {
    id: number;
    value: string;
};

type DayButtonProps = {
    title: string;
    isActive: boolean;
    onPress: () => void;
};

const DayButton = ({title, isActive, onPress}: DayButtonProps) => (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
        <View style={[styles.dayButton, isActive && styles.dayButtonActive]}>
            <Text style={[styles.dayButtonText, isActive && styles.dayButtonTextActive]}>{title}</Text>
        </View>
    </TouchableOpacity>
);

const formatNowTime = () => {
    const now = new Date();
    return `${now.getHours()}`.padStart(2, '0') + ':' + `${now.getMinutes()}`.padStart(2, '0');
};

const sortTimesAscending = (items: WeekDayTimeItem[]) =>
    [...items].sort((a, b) => {
        const [aH = 0, aM = 0] = a.value.split(':').map(Number);
        const [bH = 0, bM = 0] = b.value.split(':').map(Number);
        return aH * 60 + aM - (bH * 60 + bM);
    });
const hasTimeValue = (items: WeekDayTimeItem[], value: string) => items.some(item => item.value === value);

const cloneTimes = (items: WeekDayTimeItem[]) => items.map(item => ({...item}));
const DAY_BUTTONS_TOTAL_WIDTH =
    WEEK_DAYS.length * 46 + (WEEK_DAYS.length - 1) * DAY_BUTTONS_GAP + DAY_BUTTONS_HORIZONTAL_PADDING * 2;

type RegimenWeekDayContentProps = {
    weekDayTimesByDay: Record<WeekDayKey, WeekDayTimeItem[]>;
    weekDaySelectedDayKeys: WeekDayKey[];
    weekDayApplyToAllSourceDay: WeekDayKey | null;
    weekDayAddModalDay: WeekDayKey | null;
    onWeekDayTimesByDayChange: (value: Record<WeekDayKey, WeekDayTimeItem[]>) => void;
    onWeekDaySelectedDayKeysChange: (value: WeekDayKey[]) => void;
    onWeekDayApplyToAllSourceDayChange: (value: WeekDayKey | null) => void;
    onWeekDayAddModalDayChange: (value: WeekDayKey | null) => void;
    onWeekDayNextTimeIdUsed: () => number;
};

export const RegimenWeekDayContent = ({
    weekDayTimesByDay,
    weekDaySelectedDayKeys,
    weekDayApplyToAllSourceDay,
    weekDayAddModalDay,
    onWeekDayTimesByDayChange,
    onWeekDaySelectedDayKeysChange,
    onWeekDayApplyToAllSourceDayChange,
    onWeekDayAddModalDayChange,
    onWeekDayNextTimeIdUsed,
}: RegimenWeekDayContentProps) => {
    const {t} = useTranslation('drugsCreate', {i18n});
    const [dayButtonsContainerWidth, setDayButtonsContainerWidth] = useState(0);
    const isDayButtonsScrollEnabled = useMemo(() => {
        if (dayButtonsContainerWidth === 0) {
            return false;
        }

        return DAY_BUTTONS_TOTAL_WIDTH > dayButtonsContainerWidth;
    }, [dayButtonsContainerWidth]);

    const deactivateApplyToAll = useCallback(() => {
        onWeekDayApplyToAllSourceDayChange(null);
    }, [onWeekDayApplyToAllSourceDayChange]);

    useEffect(() => {
        if (weekDayApplyToAllSourceDay !== null && !weekDaySelectedDayKeys.includes(weekDayApplyToAllSourceDay)) {
            deactivateApplyToAll();
        }
    }, [weekDayApplyToAllSourceDay, weekDaySelectedDayKeys, deactivateApplyToAll]);

    const setDayTimes = useCallback((dayKey: WeekDayKey, updater: (prev: WeekDayTimeItem[]) => WeekDayTimeItem[]) => {
        onWeekDayTimesByDayChange({
            ...weekDayTimesByDay,
            [dayKey]: sortTimesAscending(updater(weekDayTimesByDay[dayKey])),
        });
    }, [onWeekDayTimesByDayChange, weekDayTimesByDay]);

    const deactivateDayIfEmpty = useCallback((dayKey: WeekDayKey, nextDayTimesLength: number) => {
        if (nextDayTimesLength > 0) {
            return;
        }

        onWeekDaySelectedDayKeysChange(weekDaySelectedDayKeys.filter(key => key !== dayKey));
    }, [onWeekDaySelectedDayKeysChange, weekDaySelectedDayKeys]);

    const replaceTimesInAllDays = useCallback((sourceDay: WeekDayKey) => {
        const sourceTimes = cloneTimes(weekDayTimesByDay[sourceDay]);
        const next = {...weekDayTimesByDay};

        WEEK_DAYS.forEach(day => {
            next[day.key] = cloneTimes(sourceTimes);
        });

        onWeekDayTimesByDayChange(next);
    }, [onWeekDayTimesByDayChange, weekDayTimesByDay]);

    const changeTime = useCallback(
        (dayKey: WeekDayKey, timeId: number, nextTime: string) => {
            if (weekDayApplyToAllSourceDay === null) {
                setDayTimes(dayKey, prev => prev.map(item => (item.id === timeId ? {...item, value: nextTime} : item)));
                return;
            }

            if (dayKey === weekDayApplyToAllSourceDay) {
                const next = {...weekDayTimesByDay};
                WEEK_DAYS.forEach(day => {
                    next[day.key] = sortTimesAscending(
                        weekDayTimesByDay[day.key].map(item => (item.id === timeId ? {...item, value: nextTime} : item)),
                    );
                });
                onWeekDayTimesByDayChange(next);
                return;
            }

            deactivateApplyToAll();
            setDayTimes(dayKey, prev => prev.map(item => (item.id === timeId ? {...item, value: nextTime} : item)));
        },
        [weekDayApplyToAllSourceDay, weekDayTimesByDay, onWeekDayTimesByDayChange, deactivateApplyToAll, setDayTimes],
    );

    const removeTime = useCallback(
        (dayKey: WeekDayKey, timeId: number) => {
            if (weekDayApplyToAllSourceDay === null) {
                setDayTimes(dayKey, prev => {
                    const nextDayTimes = prev.filter(item => item.id !== timeId);
                    deactivateDayIfEmpty(dayKey, nextDayTimes.length);
                    return nextDayTimes;
                });
                return;
            }

            if (dayKey === weekDayApplyToAllSourceDay) {
                const nextTimesByDay = {...weekDayTimesByDay};
                WEEK_DAYS.forEach(day => {
                    nextTimesByDay[day.key] = sortTimesAscending(
                        weekDayTimesByDay[day.key].filter(item => item.id !== timeId),
                    );
                });
                onWeekDayTimesByDayChange(nextTimesByDay);
                onWeekDaySelectedDayKeysChange(
                    weekDaySelectedDayKeys.filter(dayKeyValue => nextTimesByDay[dayKeyValue].length > 0),
                );
                return;
            }

            deactivateApplyToAll();
            setDayTimes(dayKey, prev => {
                const nextDayTimes = prev.filter(item => item.id !== timeId);
                deactivateDayIfEmpty(dayKey, nextDayTimes.length);
                return nextDayTimes;
            });
        },
        [
            weekDayApplyToAllSourceDay,
            weekDayTimesByDay,
            weekDaySelectedDayKeys,
            onWeekDayTimesByDayChange,
            onWeekDaySelectedDayKeysChange,
            deactivateApplyToAll,
            deactivateDayIfEmpty,
            setDayTimes,
        ],
    );

    const addTime = useCallback(
        (dayKey: WeekDayKey, time: string) => {
            if (weekDayApplyToAllSourceDay === null) {
                setDayTimes(dayKey, prev => {
                    if (hasTimeValue(prev, time)) {
                        return prev;
                    }

                    return [...prev, {id: onWeekDayNextTimeIdUsed(), value: time}];
                });
                return;
            }

            if (dayKey === weekDayApplyToAllSourceDay) {
                if (hasTimeValue(weekDayTimesByDay[dayKey], time)) {
                    return;
                }

                const newTime: WeekDayTimeItem = {id: onWeekDayNextTimeIdUsed(), value: time};
                const next = {...weekDayTimesByDay};
                WEEK_DAYS.forEach(day => {
                    next[day.key] = sortTimesAscending([...weekDayTimesByDay[day.key], {...newTime}]);
                });
                onWeekDayTimesByDayChange(next);
                return;
            }

            deactivateApplyToAll();
            setDayTimes(dayKey, prev => {
                if (hasTimeValue(prev, time)) {
                    return prev;
                }

                return [...prev, {id: onWeekDayNextTimeIdUsed(), value: time}];
            });
        },
        [
            weekDayApplyToAllSourceDay,
            weekDayTimesByDay,
            onWeekDayTimesByDayChange,
            onWeekDayNextTimeIdUsed,
            deactivateApplyToAll,
            setDayTimes,
        ],
    );

    const toggleDay = (dayKey: WeekDayKey) => {
        const isSelected = weekDaySelectedDayKeys.includes(dayKey);

        if (isSelected) {
            onWeekDaySelectedDayKeysChange(weekDaySelectedDayKeys.filter(key => key !== dayKey));
            return;
        }

        if (weekDayTimesByDay[dayKey].length === 0) {
            onWeekDayTimesByDayChange({
                ...weekDayTimesByDay,
                [dayKey]: [{id: onWeekDayNextTimeIdUsed(), value: formatNowTime()}],
            });
        }

        onWeekDaySelectedDayKeysChange([...weekDaySelectedDayKeys, dayKey]);
    };

    const sortedSelectedDays = useMemo(
        () =>
            weekDaySelectedDayKeys
                .slice()
                .sort((a, b) => a - b)
                .map(dayKey => WEEK_DAYS.find(day => day.key === dayKey))
                .filter(Boolean) as Array<(typeof WEEK_DAYS)[number]>,
        [weekDaySelectedDayKeys],
    );

    const addInitialValue = formatNowTime();

    return (
        <>
            <View
                style={styles.dayButtonsRow}
                onLayout={event => setDayButtonsContainerWidth(event.nativeEvent.layout.width)}>
                {isDayButtonsScrollEnabled ? (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.dayButtonsContent}>
                        {WEEK_DAYS.map(day => (
                            <DayButton
                                key={day.key}
                                title={t(`regimenTypes.weekDays.${day.shortKey}`)}
                                isActive={weekDaySelectedDayKeys.includes(day.key)}
                                onPress={() => toggleDay(day.key)}
                            />
                        ))}
                    </ScrollView>
                ) : (
                    <View style={[styles.dayButtonsContent, styles.dayButtonsContentNoScroll]}>
                        {WEEK_DAYS.map(day => (
                            <DayButton
                                key={day.key}
                                title={t(`regimenTypes.weekDays.${day.shortKey}`)}
                                isActive={weekDaySelectedDayKeys.includes(day.key)}
                                onPress={() => toggleDay(day.key)}
                            />
                        ))}
                    </View>
                )}
            </View>

            {sortedSelectedDays.length === 0 ? (
                <View style={styles.emptyDaysWarning}>
                    <InfoCard text={t('regimenTypes.warningAddOneWeekDay')}/>
                </View>
            ) : null}

            {sortedSelectedDays.map(day => (
                <Animated.View
                    style={styles.card}
                    key={day.key}
                    layout={LinearTransition.duration(200)}
                    entering={FadeInDown.duration(180)}
                    exiting={FadeOutUp.duration(160)}>
                    <Text style={styles.dayTitle}>{t(`regimenTypes.weekDays.${day.titleKey}`)}</Text>

                    <Animated.View style={styles.contentRow} layout={LinearTransition.duration(180)}>
                        <Animated.View style={styles.timeRow} layout={LinearTransition.duration(180)}>
                            {weekDayTimesByDay[day.key].map(timeItem => (
                                <Animated.View
                                    key={timeItem.id}
                                    layout={LinearTransition.duration(180)}
                                    entering={FadeIn.duration(180)}
                                    exiting={FadeOut.duration(150)}
                                    style={styles.timeItem}>
                                    <TimePickerMain
                                        value={timeItem.value}
                                        onChange={nextTime => {
                                            changeTime(day.key, timeItem.id, nextTime);
                                        }}
                                        onCancel={() => {
                                            removeTime(day.key, timeItem.id);
                                        }}
                                    />
                                </Animated.View>
                            ))}
                        </Animated.View>

                        <CircleIconButton
                            icon="clock-plus"
                            iconColor="rgba(35, 142, 235, 1)"
                            backgroundColor="rgba(35, 142, 235, 0.15)"
                            onPress={() => onWeekDayAddModalDayChange(day.key)}
                            style={styles.addButton}
                        />
                    </Animated.View>

                    <Animated.View style={styles.separator} layout={LinearTransition.duration(180)}/>

                    <Animated.View style={styles.applyRow} layout={LinearTransition.duration(180)}>
                        <Text style={styles.applyText}>{t('regimenTypes.weekDays.applyToAll')}</Text>
                        <Switch
                            isActive={weekDayApplyToAllSourceDay === day.key}
                            setIsActive={nextValue => {
                                if (!nextValue) {
                                    deactivateApplyToAll();
                                    return;
                                }

                                if (weekDayApplyToAllSourceDay !== null) {
                                    deactivateApplyToAll();
                                }

                                replaceTimesInAllDays(day.key);
                                onWeekDayApplyToAllSourceDayChange(day.key);
                            }}
                        />
                    </Animated.View>
                </Animated.View>
            ))}

            <TimePickerModal
                visible={weekDayAddModalDay !== null}
                initialValue={addInitialValue}
                title={t('regimenTypes.timeStartModalTitle')}
                onClose={() => onWeekDayAddModalDayChange(null)}
                onSave={time => {
                    if (weekDayAddModalDay !== null) {
                        addTime(weekDayAddModalDay, time);
                    }
                    onWeekDayAddModalDayChange(null);
                }}
            />
        </>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: 'rgba(255, 255, 255, 1)',
        borderRadius: 28,
        paddingVertical: 20,
        paddingHorizontal: 12,
    },
    dayButtonsContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: DAY_BUTTONS_HORIZONTAL_PADDING,
        gap: DAY_BUTTONS_GAP,
    },
    dayButtonsContentNoScroll: {
        width: '100%',
        maxWidth: 800,
        alignSelf: 'center',
        justifyContent: 'space-between',
        gap: 0,
    },
    dayButtonsContentFit: {
        width: '100%',
        justifyContent: 'flex-start',
    },
    dayButtonsRow: {
        width: '100%',
        marginTop: 8
    },
    dayButton: {
        borderRadius: 16,
        padding: 14,
        alignItems: 'center',
        width: 50,
        backgroundColor: DEFAULT_BG,
    },
    dayButtonActive: {
        backgroundColor: ACTIVE_BG,
    },
    dayButtonText: {
        color: DEFAULT_TEXT,
    },
    dayButtonTextActive: {
        color: ACTIVE_TEXT,
    },
    dayTitle: {
        fontSize: 18,
        fontWeight: '500',
        color: 'rgba(29, 26, 73, 1)',
        marginBottom: 24,
        marginLeft: 16,
    },
    contentRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    timeRow: {
        flex: 1,
        flexDirection: 'row',
        flexWrap: 'wrap',
        columnGap: 12,
        alignItems: 'flex-start',
    },
    timeItem: {
        alignSelf: 'flex-start',
    },
    addButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        marginBottom: 16
    },
    separator: {
        marginTop: 8,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(232, 231, 242, 1)',
    },
    applyRow: {
        marginTop: 22,
        marginLeft: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    applyText: {
        color: 'rgba(134, 132, 168, 1)',
    },
    emptyDaysWarning: {
        marginHorizontal: 12,
    },
});
