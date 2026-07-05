import {useEffect, useMemo, useState} from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';

import {DrugsCreateStackParamList} from '../../features/navigation/DrugsCreateStack.tsx';
import i18n from '../../features/localisation/i18n';
import {mapMealScheduleToMealItems} from '../../features/api/meals/mealScheduleMappers.ts';
import {useMealScheduleQuery} from '../../features/api/meals/useMealScheduleQuery.ts';
import {formatLocalDateIso, localDateIsoToDate} from '../../features/datetime/localDateTime.ts';
import {saveRegimenDraft} from '../../features/redux/drugsCreate/drugsCreateSlice';
import type {RegimenDraftState, RegimenTypeKey, TimeItem} from '../../features/redux/drugsCreate/types';
import {useAppDispatch, useAppSelector} from '../../features/redux/hooks';
import {Header} from '../../shared/ui/Header';
import {DropDownMain, type DropDownMainOption} from '../../shared/ui/DropDownMain';
import {DatePickerMain} from '../../shared/ui/timePickers/DatePickerMain.tsx';
import {TimePickerMain} from '../../shared/ui/timePickers/TimePickerMain.tsx';
import {InputMain} from '../../shared/ui/InputMain';
import {RegimenDailyContent} from '../../widgets/drugsCreate/regimenTypes/RegimenDailyContent.tsx';
import {RegimenEveryDayContent} from '../../widgets/drugsCreate/regimenTypes/RegimenEveryDayContent.tsx';
import {
    EVERY_HOUR_PRESETS,
    RegimentEveryHourContent,
    resolveEveryHourPreset,
} from '../../widgets/drugsCreate/regimenTypes/RegimentEveryHourContent.tsx';
import {
    IndividualDateModalState,
    IndividualDayCard,
    IndividualTimeItem,
    RegimenIndividualContent,
} from '../../widgets/drugsCreate/regimenTypes/RegimenIndividualContent.tsx';
import {
    RegimenWeekDayContent,
    WeekDayKey,
    WeekDayTimeItem,
} from '../../widgets/drugsCreate/regimenTypes/RegimenWeekDayContent.tsx';
import {RegimenMealsContent} from '../../widgets/drugsCreate/regimenTypes/regimenMealsContent/RegimenMealsContent.tsx';
import {StatusBarAvoidContainer} from "../../shared/ui/StatusBarAvoidContainer.tsx";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {CircleIconButton} from "../../shared/ui/CircleIconButton.tsx";
import {ButtonMain} from "../../shared/ui/ButtonMain.tsx";

const parseDaysAmount = (raw: string) => {
    const n = Number.parseInt(raw, 10);
    if (!Number.isFinite(n) || n < 1) {
        return 1;
    }
    return n;
};

const parseEveryHourAmount = (raw: string) => {
    const n = Number.parseInt(raw.trim(), 10);
    if (!Number.isFinite(n) || n < 1) {
        return null;
    }
    return n;
};

const cloneTimesByDay = (source: Record<number, TimeItem[]>): Record<number, TimeItem[]> =>
    Object.fromEntries(Object.entries(source).map(([key, items]) => [Number(key), [...items]]));

const FLOATING_BUTTON_BOTTOM_OFFSET = 16;
const FLOATING_BUTTON_TOP_SPACING = 12;
const MAIN_ACTION_BUTTON_HEIGHT = 48;
const INDIVIDUAL_ADD_BUTTON_HEIGHT = 48;
const INDIVIDUAL_BUTTONS_GAP = 12;

export const DrugsCreateRegimenScreen = () => {
    const {t} = useTranslation('drugsCreate', {i18n});
    const dispatch = useAppDispatch();
    const navigation = useNavigation<NativeStackNavigationProp<DrugsCreateStackParamList>>();
    const insets = useSafeAreaInsets();
    const regimen = useAppSelector(state => state.drugsCreate.regimen);
    const {data: mealSchedule} = useMealScheduleQuery();
    const mealItems = useMemo(() => mapMealScheduleToMealItems(mealSchedule), [mealSchedule]);

    const [regimenType, setRegimenType] = useState<RegimenTypeKey>(regimen.regimenType);
    const [startDateIso, setStartDateIso] = useState<string | null>(regimen.startDateIso);
    const [startTime, setStartTime] = useState(regimen.startTime);
    const [daysCount, setDaysCount] = useState(regimen.daysCount);

    const [dailyTimes, setDailyTimes] = useState([...regimen.daily.times]);
    const [dailyNextTimeId, setDailyNextTimeId] = useState(regimen.daily.nextTimeId);

    const [everyHourSelectedPresetKey, setEveryHourSelectedPresetKey] = useState(regimen.everyHour.selectedPresetKey);
    const [everyHourCustomHoursValue, setEveryHourCustomHoursValue] = useState(regimen.everyHour.customHoursValue);
    const [everyHourStartPauseTime, setEveryHourStartPauseTime] = useState(regimen.everyHour.startPauseTime);
    const [everyHourEndPauseTime, setEveryHourEndPauseTime] = useState(regimen.everyHour.endPauseTime);
    const [everyHourIsIntervalSwitchActive, setEveryHourIsIntervalSwitchActive] = useState(
        regimen.everyHour.isIntervalSwitchActive,
    );

    const [weekDayTimesByDay, setWeekDayTimesByDay] = useState<Record<WeekDayKey, WeekDayTimeItem[]>>(
        cloneTimesByDay(regimen.weekDay.timesByDay) as Record<WeekDayKey, WeekDayTimeItem[]>,
    );
    const [weekDaySelectedDayKeys, setWeekDaySelectedDayKeys] = useState<WeekDayKey[]>(
        regimen.weekDay.selectedDayKeys as WeekDayKey[],
    );
    const [weekDayApplyToAllSourceDay, setWeekDayApplyToAllSourceDay] = useState<WeekDayKey | null>(
        regimen.weekDay.applyToAllSourceDay as WeekDayKey | null,
    );
    const [weekDayNextTimeId, setWeekDayNextTimeId] = useState(regimen.weekDay.nextTimeId);
    const [weekDayAddModalDay, setWeekDayAddModalDay] = useState<WeekDayKey | null>(null);

    const [everyDayInterval, setEveryDayInterval] = useState(regimen.everyDay.interval);

    const [individualDays, setIndividualDays] = useState<IndividualDayCard[]>(
        regimen.individual.days.map(day => ({id: day.id, date: new Date(day.dateIso)})),
    );
    const [individualTimesByDay, setIndividualTimesByDay] = useState<Record<number, IndividualTimeItem[]>>(
        cloneTimesByDay(regimen.individual.timesByDay) as Record<number, IndividualTimeItem[]>,
    );
    const [individualNextDayId, setIndividualNextDayId] = useState(regimen.individual.nextDayId);
    const [individualNextTimeId, setIndividualNextTimeId] = useState(regimen.individual.nextTimeId);
    const [individualDateModalState, setIndividualDateModalState] = useState<IndividualDateModalState>(null);
    const [individualAddModalDay, setIndividualAddModalDay] = useState<number | null>(null);
    const [individualAddDateRequestKey, setIndividualAddDateRequestKey] = useState(0);

    const regimenTypeOptions: DropDownMainOption[] = [
        {value: 'dailyAtTime', title: t('regimen.types.dailyAtTime')},
        {value: 'everyNHours', title: t('regimen.types.everyNHours')},
        {value: 'weekDays', title: t('regimen.types.weekDays')},
        {value: 'everyNDays', title: t('regimen.types.everyNDays')},
        {value: 'individual', title: t('regimen.types.individual')},
        {value: 'meals', title: t('regimen.types.meals')},
    ];

    const isIndividualRegimen = regimenType === 'individual';
    const selectedEveryHourPreset = resolveEveryHourPreset(everyHourSelectedPresetKey);
    const everyHourIntervalHours = selectedEveryHourPreset.isCustom
        ? parseEveryHourAmount(everyHourCustomHoursValue)
        : selectedEveryHourPreset.hours;
    const isSaveDisabled =
        (regimenType === 'dailyAtTime' && dailyTimes.length === 0) ||
        (regimenType === 'everyNHours' && everyHourIntervalHours === null) ||
        (regimenType === 'weekDays' && weekDaySelectedDayKeys.length === 0) ||
        (regimenType === 'individual' && individualDays.length === 0) ||
        (regimenType === 'meals' && mealItems.length === 0);

    useEffect(() => {
        const max = parseDaysAmount(daysCount);
        if (everyDayInterval > max) {
            setEveryDayInterval(max);
        }
    }, [daysCount, everyDayInterval]);

    const handleDaysCountBlur = () => {
        const trimmed = daysCount.trim();
        if (trimmed === '') {
            setDaysCount('1');
            return;
        }
        const parsed = Number.parseInt(trimmed, 10);
        if (parsed === 0) {
            setDaysCount('1');
        }
    };

    const handleSubmit = () => {
        if (isSaveDisabled) {
            return;
        }

        const draftToSave: RegimenDraftState = {
            regimenType,
            startDateIso,
            startTime,
            daysCount,
            daily: {
                times: dailyTimes,
                nextTimeId: dailyNextTimeId,
            },
            everyHour: {
                selectedPresetKey: everyHourSelectedPresetKey,
                customHoursValue: everyHourCustomHoursValue,
                startPauseTime: everyHourStartPauseTime,
                endPauseTime: everyHourEndPauseTime,
                isIntervalSwitchActive: everyHourIsIntervalSwitchActive,
            },
            weekDay: {
                timesByDay: weekDayTimesByDay,
                selectedDayKeys: weekDaySelectedDayKeys,
                applyToAllSourceDay: weekDayApplyToAllSourceDay,
                nextTimeId: weekDayNextTimeId,
            },
            everyDay: {
                interval: everyDayInterval,
            },
            individual: {
                days: individualDays.map(day => ({id: day.id, dateIso: formatLocalDateIso(day.date)})),
                timesByDay: individualTimesByDay,
                nextDayId: individualNextDayId,
                nextTimeId: individualNextTimeId,
            },
            meals: regimen.meals,
        };

        dispatch(saveRegimenDraft(draftToSave));
        navigation.goBack();
    };

    const scrollBottomPadding =
        insets.bottom +
        FLOATING_BUTTON_BOTTOM_OFFSET +
        MAIN_ACTION_BUTTON_HEIGHT +
        FLOATING_BUTTON_TOP_SPACING + 12 +
        (isIndividualRegimen ? INDIVIDUAL_ADD_BUTTON_HEIGHT + INDIVIDUAL_BUTTONS_GAP : 0);

    return (
        <StatusBarAvoidContainer backgroundColor="rgba(247, 246, 251, 1)">
            <Header title={t('screenTitles.regimen')} backgroundColor={'rgba(247, 246, 251, 1)'}/>
            <ScrollView
                contentContainerStyle={[
                    styles.content,
                    {paddingBottom: scrollBottomPadding},
                ]}
                showsVerticalScrollIndicator={false}>
                <View style={styles.card}>
                    <DropDownMain
                        label={t('regimen.typeLabel')}
                        placeholder={t('regimen.typePlaceholder')}
                        modalTitle={t('regimen.typeLabel')}
                        value={regimenType}
                        onChange={value => setRegimenType(value as RegimenTypeKey)}
                        options={regimenTypeOptions}
                    />
                    {!isIndividualRegimen && (
                        <>
                            <View style={styles.dateTimeRow}>
                                <DatePickerMain
                                    label={t('regimen.dateStartLabel')}
                                    modalTitle={t('regimen.dateStartLabel')}
                                    value={localDateIsoToDate(startDateIso)}
                                    onChange={value => setStartDateIso(formatLocalDateIso(value))}
                                    style={styles.dateField}
                                />
                                <TimePickerMain
                                    label={t('regimen.timeStartLabel')}
                                    modalTitle={t('regimen.timeStartLabel')}
                                    value={startTime}
                                    onChange={setStartTime}
                                    style={styles.timeField}
                                />
                            </View>
                            <InputMain
                                label={t('regimen.daysCountLabel')}
                                value={daysCount}
                                onChange={setDaysCount}
                                onBlur={handleDaysCountBlur}
                                keyboardType="numeric"
                            />
                        </>
                    )}
                </View>

                {regimenType === 'dailyAtTime' && (
                    <RegimenDailyContent
                        dailyTimes={dailyTimes}
                        onDailyTimesChange={setDailyTimes}
                        onDailyTimeIdUsed={() => {
                            const nextId = dailyNextTimeId;
                            setDailyNextTimeId(prev => prev + 1);
                            return nextId;
                        }}
                    />
                )}
                {regimenType === 'everyNHours' && (
                    <RegimentEveryHourContent
                        everyHourSelectedPresetKey={everyHourSelectedPresetKey}
                        everyHourCustomHoursValue={everyHourCustomHoursValue}
                        everyHourStartPauseTime={everyHourStartPauseTime}
                        everyHourEndPauseTime={everyHourEndPauseTime}
                        everyHourIsIntervalSwitchActive={everyHourIsIntervalSwitchActive}
                        onEveryHourPresetChange={(presetKey, presetHours) => {
                            setEveryHourSelectedPresetKey(presetKey);
                            setEveryHourCustomHoursValue(`${presetHours}`);
                        }}
                        onEveryHourCustomHoursValueChange={value => {
                            setEveryHourCustomHoursValue(value);
                            const parsedValue = parseEveryHourAmount(value);
                            if (!parsedValue) {
                                setEveryHourSelectedPresetKey('custom');
                                return;
                            }

                            const matchedPreset = EVERY_HOUR_PRESETS.find(
                                preset => !preset.isCustom && preset.hours === parsedValue,
                            );
                            setEveryHourSelectedPresetKey(matchedPreset ? matchedPreset.key : 'custom');
                        }}
                        onEveryHourStartPauseTimeChange={setEveryHourStartPauseTime}
                        onEveryHourEndPauseTimeChange={setEveryHourEndPauseTime}
                        onEveryHourIntervalSwitchActiveChange={setEveryHourIsIntervalSwitchActive}
                    />
                )}
                {regimenType === 'weekDays' && (
                    <RegimenWeekDayContent
                        weekDayTimesByDay={weekDayTimesByDay}
                        weekDaySelectedDayKeys={weekDaySelectedDayKeys}
                        weekDayApplyToAllSourceDay={weekDayApplyToAllSourceDay}
                        weekDayAddModalDay={weekDayAddModalDay}
                        onWeekDayTimesByDayChange={setWeekDayTimesByDay}
                        onWeekDaySelectedDayKeysChange={setWeekDaySelectedDayKeys}
                        onWeekDayApplyToAllSourceDayChange={setWeekDayApplyToAllSourceDay}
                        onWeekDayAddModalDayChange={setWeekDayAddModalDay}
                        onWeekDayNextTimeIdUsed={() => {
                            const nextId = weekDayNextTimeId;
                            setWeekDayNextTimeId(prev => prev + 1);
                            return nextId;
                        }}
                    />
                )}
                {regimenType === 'everyNDays' && (
                    <RegimenEveryDayContent
                        daysCount={daysCount}
                        value={everyDayInterval}
                        onChange={setEveryDayInterval}
                    />
                )}
                {regimenType === 'meals' && <RegimenMealsContent />}
                {isIndividualRegimen && (
                    <RegimenIndividualContent
                        openAddDateRequestKey={individualAddDateRequestKey}
                        individualDays={individualDays}
                        individualTimesByDay={individualTimesByDay}
                        individualDateModalState={individualDateModalState}
                        individualAddModalDay={individualAddModalDay}
                        onIndividualDaysChange={setIndividualDays}
                        onIndividualTimesByDayChange={setIndividualTimesByDay}
                        onIndividualDateModalStateChange={setIndividualDateModalState}
                        onIndividualAddModalDayChange={setIndividualAddModalDay}
                        onIndividualDayIdUsed={() => {
                            const nextId = individualNextDayId;
                            setIndividualNextDayId(prev => prev + 1);
                            return nextId;
                        }}
                        onIndividualTimeIdUsed={() => {
                            const nextId = individualNextTimeId;
                            setIndividualNextTimeId(prev => prev + 1);
                            return nextId;
                        }}
                    />
                )}
            </ScrollView>
            {isIndividualRegimen && (
                <CircleIconButton
                    icon="calendar-plus"
                    onPress={() => setIndividualAddDateRequestKey(prev => prev + 1)}
                    style={[
                        styles.individualAddButton,
                        {
                            bottom:
                                insets.bottom +
                                FLOATING_BUTTON_BOTTOM_OFFSET +
                                MAIN_ACTION_BUTTON_HEIGHT +
                                INDIVIDUAL_BUTTONS_GAP,
                        },
                    ]}
                />
            )}
            <ButtonMain
                title={t('regimen.saveButton')}
                onPress={handleSubmit}
                disabled={isSaveDisabled}
                style={[styles.mainActionButton, {bottom: insets.bottom + FLOATING_BUTTON_BOTTOM_OFFSET}]}
            />
        </StatusBarAvoidContainer>
    );
};

const styles = StyleSheet.create({
    content: {
        marginTop: 12,
        gap: 16,
    },
    card: {
        backgroundColor: 'rgba(255, 255, 255, 1)',
        borderRadius: 28,
        paddingVertical: 20,
        paddingHorizontal: 12,
        gap: 8,
    },
    dateTimeRow: {
        flexDirection: 'row',
        gap: 14,
    },
    dateField: {
        flex: 1,
    },
    timeField: {
        flex: 1,
    },
    individualAddButton: {
        position: 'absolute',
        right: 12,
    },
    mainActionButton: {
        position: 'absolute',
        left: 12,
        right: 12,
    },
});
