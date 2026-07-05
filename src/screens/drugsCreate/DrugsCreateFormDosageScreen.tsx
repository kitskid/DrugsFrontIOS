import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {StyleSheet, View, type LayoutChangeEvent} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import {DrugsCreateStackParamList} from '../../features/navigation/DrugsCreateStack';
import i18n from '../../features/localisation/i18n';
import {
  type DosageUnitKey,
  getAllowedDosageUnitKeys,
  isDosageUnitAllowedForReleaseForm,
  releaseFormOptionKeys,
  resolveDosageUnitKey,
  resolveReleaseFormDisplayValue,
  resolveReleaseFormKey,
} from '../../features/drugsCreate/releaseFormDosageUnits';
import {setReleaseDosage} from '../../features/redux/drugsCreate/drugsCreateSlice';
import {useAppDispatch, useAppSelector} from '../../features/redux/hooks';
import {Header} from '../../shared/ui/Header';
import {ButtonMain} from '../../shared/ui/ButtonMain';
import {DropDownMain, type DropDownMainOption} from '../../shared/ui/DropDownMain';
import {InputMain} from '../../shared/ui/InputMain';
import {StatusBarAvoidContainer} from '../../shared/ui/StatusBarAvoidContainer.tsx';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

const CARD_EXPAND_DURATION = 280;

export const DrugsCreateFormDosageScreen = () => {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const {t} = useTranslation('drugsCreate', {i18n});
  const navigation = useNavigation<NativeStackNavigationProp<DrugsCreateStackParamList>>();
  const releaseDosage = useAppSelector(state => state.drugsCreate.releaseDosage);
  const [releaseForm, setReleaseForm] = useState(releaseDosage.releaseForm ?? '');
  const [dosageAmount, setDosageAmount] = useState(releaseDosage.dosageAmount ?? '');
  const [dosageUnit, setDosageUnit] = useState(releaseDosage.dosageUnit ?? '');
  const [releaseFormError, setReleaseFormError] = useState<string | null>(null);
  const [dosageAmountError, setDosageAmountError] = useState<string | null>(null);
  const [dosageUnitError, setDosageUnitError] = useState<string | null>(null);

  const hasInitialReleaseForm = Boolean(releaseDosage.releaseForm?.trim());
  const [isDetailsVisible, setIsDetailsVisible] = useState(hasInitialReleaseForm);
  const detailsHeight = useSharedValue(0);
  const expandProgress = useSharedValue(hasInitialReleaseForm ? 1 : 0);
  const hasAnimatedExpandRef = useRef(hasInitialReleaseForm);

  const getReleaseFormLabel = useCallback(
    (key: (typeof releaseFormOptionKeys)[number]) => t(`formDosage.releaseFormOptions.${key}`),
    [t],
  );
  const getDosageUnitLabel = useCallback(
    (key: DosageUnitKey) => t(`formDosage.dosageUnitOptions.${key}`),
    [t],
  );

  const releaseFormOptions: DropDownMainOption[] = useMemo(
    () =>
      releaseFormOptionKeys.map(optionKey => {
        const title = getReleaseFormLabel(optionKey);
        return {title, value: title};
      }),
    [getReleaseFormLabel],
  );

  const selectedReleaseFormKey = useMemo(
    () => resolveReleaseFormKey(releaseForm, getReleaseFormLabel),
    [getReleaseFormLabel, releaseForm],
  );

  const dosageUnitOptions: DropDownMainOption[] = useMemo(() => {
    const allowedKeys = getAllowedDosageUnitKeys(selectedReleaseFormKey);
    return allowedKeys.map(optionKey => {
      const title = t(`formDosage.dosageUnitOptions.${optionKey}`);
      return {title, value: title};
    });
  }, [selectedReleaseFormKey, t]);

  const detailsAnimatedStyle = useAnimatedStyle(() => ({
    height: detailsHeight.value * expandProgress.value,
    opacity: expandProgress.value,
    overflow: 'hidden',
  }));

  const handleDetailsMeasure = useCallback(
    (event: LayoutChangeEvent) => {
      const measuredHeight = event.nativeEvent.layout.height;
      if (measuredHeight > 0 && measuredHeight !== detailsHeight.value) {
        detailsHeight.value = measuredHeight;
      }
    },
    [detailsHeight],
  );

  useFocusEffect(
    useCallback(() => {
      const storedReleaseForm = releaseDosage.releaseForm ?? '';
      const displayReleaseForm = resolveReleaseFormDisplayValue(
        storedReleaseForm,
        getReleaseFormLabel,
      );
      const hasStoredReleaseForm = Boolean(displayReleaseForm.trim());

      setReleaseForm(displayReleaseForm);
      setDosageAmount(releaseDosage.dosageAmount ?? '');
      setDosageUnit(releaseDosage.dosageUnit ?? '');
      setIsDetailsVisible(hasStoredReleaseForm);
      expandProgress.value = hasStoredReleaseForm ? 1 : 0;
    }, [expandProgress, getReleaseFormLabel, releaseDosage]),
  );

  useEffect(() => {
    if (!releaseForm.trim() || isDetailsVisible) {
      return;
    }

    setIsDetailsVisible(true);

    if (!hasAnimatedExpandRef.current) {
      hasAnimatedExpandRef.current = true;
      expandProgress.value = withTiming(1, {duration: CARD_EXPAND_DURATION});
    } else {
      expandProgress.value = 1;
    }
  }, [expandProgress, isDetailsVisible, releaseForm]);

  useEffect(() => {
    if (!selectedReleaseFormKey || !dosageUnit.trim()) {
      return;
    }

    const currentDosageUnitKey = resolveDosageUnitKey(dosageUnit, getDosageUnitLabel);
    if (
      currentDosageUnitKey &&
      !isDosageUnitAllowedForReleaseForm(selectedReleaseFormKey, currentDosageUnitKey)
    ) {
      setDosageUnit('');
    }
  }, [dosageUnit, getDosageUnitLabel, selectedReleaseFormKey]);

  const clearErrors = () => {
    setReleaseFormError(null);
    setDosageAmountError(null);
    setDosageUnitError(null);
  };

  const handleReleaseFormChange = (value: string) => {
    clearErrors();

    const nextReleaseFormKey = resolveReleaseFormKey(value, getReleaseFormLabel);
    const currentDosageUnitKey = resolveDosageUnitKey(dosageUnit, getDosageUnitLabel);

    if (
      currentDosageUnitKey &&
      nextReleaseFormKey &&
      !isDosageUnitAllowedForReleaseForm(nextReleaseFormKey, currentDosageUnitKey)
    ) {
      setDosageUnit('');
    }

    setReleaseForm(value);
  };

  const handleDosageAmountChange = (value: string) => {
    clearErrors();
    setDosageAmount(value);
  };

  const handleDosageUnitChange = (value: string) => {
    clearErrors();
    setDosageUnit(value);
  };

  const detailsFields = (
    <>
      <InputMain
        label={t('formDosage.dosageAmountLabel')}
        placeholder={t('formDosage.dosageAmountPlaceholder')}
        value={dosageAmount}
        onChange={handleDosageAmountChange}
        keyboardType="numeric"
        style={styles.fieldSpacing}
        errorText={dosageAmountError}
      />
      <DropDownMain
        label={t('formDosage.dosageUnitLabel')}
        placeholder={t('formDosage.dosageUnitPlaceholder')}
        value={dosageUnit}
        onChange={handleDosageUnitChange}
        options={dosageUnitOptions}
        style={styles.fieldSpacing}
        errorText={dosageUnitError}
      />
    </>
  );

  return (
    <StatusBarAvoidContainer backgroundColor="rgba(247, 246, 251, 1)">
      <Header title={t('screenTitles.formDosage')} backgroundColor={'rgba(247, 246, 251, 1)'} />
      <View style={styles.screenContent}>
        <View style={styles.content}>
          <View style={styles.card}>
            <DropDownMain
              label={t('formDosage.releaseFormLabel')}
              placeholder={t('formDosage.releaseFormPlaceholder')}
              value={releaseForm}
              onChange={handleReleaseFormChange}
              options={releaseFormOptions}
              errorText={releaseFormError}
            />

            <View pointerEvents="none" style={styles.detailsMeasurer}>
              <View onLayout={handleDetailsMeasure}>{detailsFields}</View>
            </View>

            {isDetailsVisible ? (
              <Animated.View style={detailsAnimatedStyle}>{detailsFields}</Animated.View>
            ) : null}
          </View>
        </View>
        <ButtonMain
          title={t('formDosage.saveButton')}
          onPress={() => {
            const trimmedReleaseForm = releaseForm.trim();
            const trimmedDosageAmount = dosageAmount.trim();
            const trimmedDosageUnit = dosageUnit.trim();
            const requiredErrorText = t('formDosage.requiredError');

            const hasReleaseFormError = !trimmedReleaseForm;
            const hasDosageAmountError = !trimmedDosageAmount;
            const hasDosageUnitError = !trimmedDosageUnit;

            setReleaseFormError(hasReleaseFormError ? requiredErrorText : null);
            setDosageAmountError(hasDosageAmountError ? requiredErrorText : null);
            setDosageUnitError(hasDosageUnitError ? requiredErrorText : null);

            if (hasReleaseFormError || hasDosageAmountError || hasDosageUnitError) {
              return;
            }

            const normalizedReleaseForm = trimmedReleaseForm
              ? trimmedReleaseForm.charAt(0).toLowerCase() + trimmedReleaseForm.slice(1)
              : '';

            dispatch(
              setReleaseDosage({
                releaseForm: normalizedReleaseForm,
                dosageAmount: trimmedDosageAmount,
                dosageUnit: trimmedDosageUnit,
              }),
            );

            navigation.goBack();
          }}
          style={[styles.saveButton, {marginBottom: insets.bottom + 16}]}
        />
      </View>
    </StatusBarAvoidContainer>
  );
};

const styles = StyleSheet.create({
  screenContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  content: {
    marginTop: 12,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 1)',
    borderRadius: 28,
    paddingVertical: 20,
    paddingHorizontal: 12,
  },
  fieldSpacing: {
    marginTop: 8,
  },
  detailsMeasurer: {
    position: 'absolute',
    left: 0,
    right: 0,
    opacity: 0,
    zIndex: -1,
  },
  saveButton: {
    marginHorizontal: 12,
  },
});
