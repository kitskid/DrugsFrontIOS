import {useCallback, useEffect, useRef, useState} from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';
import axios from 'axios';
import {useNavigation, useRoute} from '@react-navigation/native';
import type {RouteProp} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {BottomSheetModal} from '@gorhom/bottom-sheet';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {useTranslation} from 'react-i18next';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import type {AppStackParamList} from '../../app/AppStack.tsx';
import type {DrugsCreateStackParamList} from '../../features/navigation/DrugsCreateStack.tsx';
import {CALENDAR_QUERY_KEY} from '../../features/api/apiCalendar.ts';
import {invalidateDocumentsQueries} from '../../features/api/apiDocuments.ts';
import {
  apiDrugs,
  MEDICATION_PRESCRIPTIONS_QUERY_KEY,
  type MedicationPrescriptionFileDto,
  type PrescriptionDocumentDto,
  type UpdateMedicationPrescriptionDto,
} from '../../features/api/drugs/apiDrugs.ts';
import {apiFiles, type FileDto} from '../../features/api/files/apiFiles.ts';
import {deleteUnsavedUploadedFiles} from '../../features/api/files/cleanupUnsavedUploadedFiles.ts';
import {buildCreateMedicationPrescriptionPayload} from '../../features/api/drugs/buildCreateMedicationPrescriptionPayload.ts';
import {
  buildUpdateMedicationPrescriptionPayload,
  mapPrescriptionToDrugsCreateState,
} from '../../features/api/drugs/prescriptionEditMapping.ts';
import {apiProfile} from '../../features/api/apiProfile.ts';
import {MEAL_SCHEDULE_QUERY_KEY, areMealRemindersEnabled, type MealScheduleDto} from '../../features/api/meals/types.ts';
import {syncMealScheduleHasReminderIfChanged} from '../../features/api/meals/syncMealScheduleHasReminder.ts';
import i18n from '../../features/localisation/i18n';
import {
  hasAllFormDosageValues,
  hydrateDrugsCreateState,
  isRegimenConfigured,
  resetDrugsCreateState,
  updateMealsRegimenDraft,
} from '../../features/redux/drugsCreate/drugsCreateSlice.ts';
import {useAppDispatch, useAppSelector} from '../../features/redux/hooks.ts';
import {useToast} from '../../features/toasts/useToast.ts';
import {Header} from '../../shared/ui/Header';
import {ButtonMain} from '../../shared/ui/ButtonMain';
import {StatusBarAvoidContainer} from '../../shared/ui/StatusBarAvoidContainer.tsx';
import {Tabs} from '../../shared/ui/Tabs';
import {CircleIconButton} from '../../shared/ui/CircleIconButton';
import {AddFileModal, type SelectedFile} from '../../shared/ui/drugs/AddFileModal.tsx';
import {DrugsCreateInfoTab} from '../../widgets/drugsCreate/DrugsCreateInfoTab.tsx';
import {DrugsCreateFilesTab} from '../../widgets/drugsCreate/DrugsCreateFilesTab.tsx';
import {DrugsCreateCalendarTab} from '../../widgets/drugsCreate/DrugsCreateCalendarTab.tsx';
import {DrugDeleteModal} from '../../widgets/drugsCreate/DrugDeleteModal.tsx';
import {DrugsCreateSkeleton} from '../../widgets/drugsCreate/DrugsCreateSkeleton.tsx';
import type {DrugsCreateFileItem} from '../../widgets/drugsCreate/FileCard.tsx';

const SAVE_BUTTON_BOTTOM_OFFSET = 16;
const SAVE_BUTTON_HEIGHT = 48;
const SAVE_BUTTON_TOP_SPACING = 12;
const FILES_ACTION_BUTTON_SIZE = 48;
const FILES_ACTION_BUTTON_BOTTOM_SPACING = 16;
const TABS_TOP_MARGIN = 12;

type DrugsCreateTabId = 'general' | 'intakes' | 'files';

const getFileExtension = (fileName: string): string => {
  const lastDotIndex = fileName.lastIndexOf('.');

  if (lastDotIndex === -1) {
    return '';
  }

  return fileName.slice(lastDotIndex + 1).toLowerCase();
};

const createLocalFileId = (): string =>
  `file-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const buildFileAttachments = (
  items: DrugsCreateFileItem[],
): MedicationPrescriptionFileDto[] => {
  const attachments: MedicationPrescriptionFileDto[] = [];

  items.forEach(item => {
    const serverFile = item.serverFile;

    if (item.status !== 'uploaded' || !serverFile || item.documentId) {
      return;
    }

    attachments.push({
      fileId: serverFile.id,
      fileName: serverFile.fileName ?? item.fileName,
      fileSize: serverFile.fileSize ?? item.sizeBytes,
      mimeType: serverFile.mimeType ?? item.sourceFile?.mimeType ?? 'application/octet-stream',
    });
  });

  return attachments;
};

const mapDocumentsToFileItems = (
  documents: PrescriptionDocumentDto[],
): DrugsCreateFileItem[] =>
  documents.map(document => {
    const serverFile: FileDto = {
      id: document.fileId,
      userId: document.patientId ?? '',
      fileName: document.fileName,
      fileSize: document.fileSize,
      mimeType: document.mimeType ?? null,
      uploadDate: document.uploadDate ?? document.createdAt ?? '',
      description: document.description ?? null,
      createdAt: document.createdAt ?? '',
      updatedAt: document.updatedAt ?? '',
      deletedAt: document.deletedAt ?? null,
      status: 'CONFIRMED',
    };

    return {
      localId: `document-${document.id}`,
      fileName: document.fileName,
      fileType: getFileExtension(document.fileName),
      sizeBytes: document.fileSize,
      status: 'uploaded',
      documentId: document.id,
      serverFile,
    };
  });

export const DrugsCreateScreen = () => {
  const {t} = useTranslation('drugsCreate', {i18n});
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const route = useRoute<RouteProp<DrugsCreateStackParamList, 'DrugsCreateScreen'>>();
  const prescriptionId = route.params?.prescriptionId;
  const initialCalendarMonth = route.params?.initialMonth;
  const initialCalendarYear = route.params?.initialYear;
  const requestedTab = route.params?.activeTab;
  const requestedOpenIntakeId = route.params?.openIntakeId;
  const isEditMode = Boolean(prescriptionId);
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const {showToast} = useToast();
  const releaseDosage = useAppSelector(state => state.drugsCreate.releaseDosage);
  const regimen = useAppSelector(state => state.drugsCreate.regimen);
  const notifications = useAppSelector(state => state.drugsCreate.notifications);
  const [selectedTabId, setSelectedTabId] = useState<DrugsCreateTabId>(
    () => requestedTab ?? 'general',
  );
  const [keepIntakesTabMounted, setKeepIntakesTabMounted] = useState(
    () => (requestedTab ?? 'general') === 'intakes',
  );
  const [openIntakeId, setOpenIntakeId] = useState<string | undefined>(
    requestedOpenIntakeId,
  );
  const [shouldOpenNameModal, setShouldOpenNameModal] = useState(!isEditMode);
  const [isHydrated, setIsHydrated] = useState(!isEditMode);
  const hydratedPrescriptionIdRef = useRef<string | null>(null);
  const initialPayloadJsonRef = useRef<string | null>(null);
  const isDeletingPrescriptionRef = useRef(false);
  const medicationIdRef = useRef<string | null>(null);
  const medicationNameRef = useRef('');
  const [drugName, setDrugName] = useState('');
  const [isDrugNameError, setIsDrugNameError] = useState(false);
  const [isFormDosageError, setIsFormDosageError] = useState(false);
  const [isRegimenError, setIsRegimenError] = useState(false);
  const [saveValidationAttempt, setSaveValidationAttempt] = useState(0);
  const [note, setNote] = useState('');
  const [isReminderEnabled, setIsReminderEnabled] = useState(true);
  const [files, setFiles] = useState<DrugsCreateFileItem[]>([]);
  const addFileModalRef = useRef<BottomSheetModal>(null);
  const deleteDrugModalRef = useRef<BottomSheetModal>(null);
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());
  const filesRef = useRef<DrugsCreateFileItem[]>(files);
  const skipOrphanFileCleanupRef = useRef(false);
  const isFilesTab = selectedTabId === 'files';
  const isIntakesTab = selectedTabId === 'intakes';

  filesRef.current = files;

  useEffect(() => {
    skipOrphanFileCleanupRef.current = false;
  }, [prescriptionId]);

  useEffect(() => {
    return () => {
      if (skipOrphanFileCleanupRef.current) {
        return;
      }

      void deleteUnsavedUploadedFiles(filesRef.current);
    };
  }, []);

  const {mutateAsync: createDrugPrescriptionMutation, isPending: isCreating} = useMutation({
    mutationFn: (payload: Parameters<typeof apiDrugs.createDrugPrescriptions>[0]) =>
      apiDrugs.createDrugPrescriptions(payload),
  });

  const {mutateAsync: updateDrugPrescriptionMutation, isPending: isUpdating} = useMutation({
    mutationFn: ({id, payload}: {id: string; payload: UpdateMedicationPrescriptionDto}) =>
      apiDrugs.updateDrugPrescription(id, payload),
  });

  const {mutateAsync: syncMealScheduleReminderMutation, isPending: isSyncingMealScheduleReminder} =
    useMutation({
      mutationFn: ({
        nextHasReminder,
        initialHasReminder,
      }: {
        nextHasReminder: boolean;
        initialHasReminder: boolean;
      }) => syncMealScheduleHasReminderIfChanged(nextHasReminder, initialHasReminder),
      onSuccess: savedSchedule => {
        if (!savedSchedule) {
          return;
        }

        queryClient.setQueryData(MEAL_SCHEDULE_QUERY_KEY, savedSchedule);

        const remindersEnabled = areMealRemindersEnabled(savedSchedule);
        dispatch(
          updateMealsRegimenDraft({
            hasMealReminderEnabled: remindersEnabled,
            initialHasMealReminderEnabled: remindersEnabled,
          }),
        );
      },
    });

  const {
    data: prescriptionData,
    isLoading: isLoadingPrescription,
    isFetching: isFetchingPrescription,
    isError: isPrescriptionError,
  } = useQuery({
    queryKey: [...MEDICATION_PRESCRIPTIONS_QUERY_KEY, 'detail', prescriptionId],
    queryFn: async () => {
      const response = await apiDrugs.getMedicationPrescriptionById(prescriptionId as string);
      return response.data;
    },
    enabled: isEditMode,
    refetchOnMount: 'always',
  });

  const isSaving = isCreating || isUpdating || isSyncingMealScheduleReminder;

  const syncMealsRegimenBeforeSave = useCallback(async (): Promise<boolean> => {
    if (regimen.regimenType !== 'meals') {
      return false;
    }

    const {hasMealReminderEnabled, initialHasMealReminderEnabled} = regimen.meals;

    const cachedSchedule = queryClient.getQueryData<MealScheduleDto | null>(MEAL_SCHEDULE_QUERY_KEY);
    const schedule = cachedSchedule ?? (await apiProfile.meals.getMe()).data;

    if (!schedule) {
      return false;
    }

    const serverRemindersEnabled = areMealRemindersEnabled(schedule);
    const baselineEnabled = initialHasMealReminderEnabled ?? serverRemindersEnabled;

    if (initialHasMealReminderEnabled == null) {
      dispatch(
        updateMealsRegimenDraft({
          initialHasMealReminderEnabled: serverRemindersEnabled,
        }),
      );
    }

    if (hasMealReminderEnabled === baselineEnabled) {
      return false;
    }

    await syncMealScheduleReminderMutation({
      nextHasReminder: hasMealReminderEnabled,
      initialHasReminder: baselineEnabled,
    });

    return true;
  }, [
    dispatch,
    queryClient,
    regimen.meals,
    regimen.regimenType,
    syncMealScheduleReminderMutation,
  ]);

  const handleDeletePress = useCallback(() => {
    deleteDrugModalRef.current?.present();
  }, []);

  const handleConfirmDelete = useCallback(
    async (signal: AbortSignal) => {
      if (!prescriptionId) {
        return;
      }

      isDeletingPrescriptionRef.current = true;

      try {
        await apiDrugs.deleteDrugPrescription(prescriptionId, {signal});

        if (signal.aborted) {
          return;
        }

        const detailQueryKey = [
          ...MEDICATION_PRESCRIPTIONS_QUERY_KEY,
          'detail',
          prescriptionId,
        ] as const;

        // Drop the detail query so invalidate won't refetch a deleted prescription.
        await queryClient.cancelQueries({queryKey: detailQueryKey});
        queryClient.removeQueries({queryKey: detailQueryKey});

        showToast({variant: 'success', text: t('toasts.deleteSuccess')});
        navigation.goBack();

        // Refresh only list queries in the background — don't block the modal/UI.
        void queryClient.invalidateQueries({
          queryKey: MEDICATION_PRESCRIPTIONS_QUERY_KEY,
          predicate: query => query.queryKey[1] !== 'detail',
        });
        void queryClient.invalidateQueries({queryKey: CALENDAR_QUERY_KEY});
        void invalidateDocumentsQueries(queryClient);
      } catch (error) {
        isDeletingPrescriptionRef.current = false;

        if (signal.aborted || (axios.isAxiosError(error) && error.code === 'ERR_CANCELED')) {
          return;
        }

        showToast({variant: 'error', text: t('toasts.deleteServerError')});
      }
    },
    [navigation, prescriptionId, queryClient, showToast, t],
  );

  useEffect(() => {
    hydratedPrescriptionIdRef.current = null;
    setIsHydrated(false);
  }, [prescriptionId]);

  useEffect(() => {
    if (
      !isEditMode ||
      !prescriptionId ||
      !prescriptionData ||
      isFetchingPrescription ||
      hydratedPrescriptionIdRef.current === prescriptionId
    ) {
      return;
    }

    hydratedPrescriptionIdRef.current = prescriptionId;
    const mapped = mapPrescriptionToDrugsCreateState(prescriptionData);

    dispatch(
      hydrateDrugsCreateState({
        releaseDosage: mapped.releaseDosage,
        regimen: mapped.regimen,
        notifications: mapped.notifications,
      }),
    );
    setDrugName(mapped.drugName);
    setNote(mapped.note);
    setIsReminderEnabled(mapped.isReminderEnabled);
    setFiles(mapDocumentsToFileItems(prescriptionData.documents ?? []));
    setShouldOpenNameModal(false);
    medicationIdRef.current = mapped.medicationId;
    medicationNameRef.current = mapped.medicationName;

    try {
      initialPayloadJsonRef.current = JSON.stringify(
        buildUpdateMedicationPrescriptionPayload({
          drugName: mapped.drugName,
          note: mapped.note,
          isReminderEnabled: mapped.isReminderEnabled,
          releaseDosage: mapped.releaseDosage,
          regimen: mapped.regimen,
          notifications: mapped.notifications,
          medicationId: mapped.medicationId,
          medicationName: mapped.medicationName,
        }),
      );
    } catch {
      initialPayloadJsonRef.current = null;
    }

    setIsHydrated(true);
  }, [dispatch, isEditMode, isFetchingPrescription, prescriptionId, prescriptionData]);

  useEffect(() => {
    if (isPrescriptionError && !isDeletingPrescriptionRef.current) {
      showToast({variant: 'error', text: t('toasts.loadError')});
      navigation.goBack();
    }
  }, [isPrescriptionError, navigation, showToast, t]);

  useEffect(() => {
    if (requestedTab) {
      setSelectedTabId(requestedTab);
    }
  }, [requestedTab]);

  useEffect(() => {
    if (requestedOpenIntakeId) {
      setOpenIntakeId(requestedOpenIntakeId);
    }
  }, [requestedOpenIntakeId]);

  const uploadSelectedFile = useCallback(async (selectedFile: SelectedFile, localId: string) => {
    const abortController = new AbortController();
    abortControllersRef.current.set(localId, abortController);

    try {
      const response = await apiFiles.uploadFile(
        {
          uri: selectedFile.uri,
          fileName: selectedFile.fileName,
          mimeType: selectedFile.mimeType,
        },
        {
          signal: abortController.signal,
          onUploadProgress: progress => {
            setFiles(prev =>
              prev.map(file =>
                file.localId === localId ? {...file, progress} : file,
              ),
            );
          },
        },
      );

      if (abortController.signal.aborted) {
        return;
      }

      setFiles(prev =>
        prev.map(file =>
          file.localId === localId
            ? {
                ...file,
                status: 'uploaded',
                progress: undefined,
                sizeBytes: response.data.fileSize,
                serverFile: response.data,
              }
            : file,
        ),
      );
    } catch (error) {
      if (abortController.signal.aborted) {
        return;
      }

      if (axios.isAxiosError(error) && error.code === 'ERR_CANCELED') {
        return;
      }

      if (error instanceof Error && error.message === 'Upload canceled') {
        return;
      }

      if (axios.isAxiosError(error)) {
        console.warn('File upload failed', {
          code: error.code,
          message: error.message,
          status: error.response?.status,
          localId,
          uri: selectedFile.uri,
        });
      } else {
        console.warn('File upload failed', {error, localId, uri: selectedFile.uri});
      }

      setFiles(prev =>
        prev.map(file =>
          file.localId === localId
            ? {...file, status: 'error', progress: undefined}
            : file,
        ),
      );
    } finally {
      abortControllersRef.current.delete(localId);
    }
  }, []);

  const handleFileSelected = useCallback(
    (selectedFile: SelectedFile) => {
      const localId = createLocalFileId();
      const nextFile: DrugsCreateFileItem = {
        localId,
        fileName: selectedFile.fileName,
        fileType: getFileExtension(selectedFile.fileName),
        sizeBytes: selectedFile.fileSize ?? 0,
        status: 'uploading',
        progress: 0,
        sourceFile: {
          uri: selectedFile.uri,
          mimeType: selectedFile.mimeType,
        },
      };

      setFiles(prev => [...prev, nextFile]);
      void uploadSelectedFile(selectedFile, localId);
    },
    [uploadSelectedFile],
  );

  const handleCancelUpload = useCallback((localId: string) => {
    abortControllersRef.current.get(localId)?.abort();
    abortControllersRef.current.delete(localId);
    setFiles(prev => prev.filter(file => file.localId !== localId));
  }, []);

  const handleRetryUpload = useCallback(
    (localId: string) => {
      const targetFile = files.find(file => file.localId === localId);

      if (!targetFile?.sourceFile) {
        return;
      }

      setFiles(prev =>
        prev.map(file =>
          file.localId === localId
            ? {...file, status: 'uploading', progress: 0}
            : file,
        ),
      );

      void uploadSelectedFile(
        {
          uri: targetFile.sourceFile.uri,
          fileName: targetFile.fileName,
          mimeType: targetFile.sourceFile.mimeType,
          fileSize: targetFile.sizeBytes,
        },
        localId,
      );
    },
    [files, uploadSelectedFile],
  );

  const handleDeleteFile = useCallback(
    async (localId: string) => {
      const targetFile = files.find(file => file.localId === localId);

      if (!targetFile) {
        return;
      }

      if (targetFile.documentId && prescriptionId) {
        try {
          const response = await apiDrugs.removeDrugPrescriptionAttachment(
            prescriptionId,
            targetFile.documentId,
          );
          queryClient.setQueryData(
            [...MEDICATION_PRESCRIPTIONS_QUERY_KEY, 'detail', prescriptionId],
            response.data,
          );
          void invalidateDocumentsQueries(queryClient);
        } catch {
          showToast({variant: 'error', text: t('toasts.fileDeleteError')});
          return;
        }
      } else if (targetFile.serverFile?.id) {
        try {
          await apiFiles.deleteFile(targetFile.serverFile.id);
        } catch {
          showToast({variant: 'error', text: t('toasts.fileDeleteError')});
          return;
        }
      }

      setFiles(prev => prev.filter(file => file.localId !== localId));
    },
    [files, prescriptionId, queryClient, showToast, t],
  );

  const handleDownloadFile = useCallback(
    async (localId: string) => {
      const targetFile = files.find(file => file.localId === localId);

      if (!targetFile?.serverFile?.id || targetFile.isDownloading) {
        return;
      }

      setFiles(prev =>
        prev.map(file =>
          file.localId === localId
            ? {...file, isDownloading: true, progress: 0}
            : file,
        ),
      );

      try {
        const savedFile = await apiFiles.downloadFileToDevice(
          targetFile.serverFile.id,
          targetFile.fileName,
          {
            onDownloadProgress: progress => {
              setFiles(prev =>
                prev.map(file =>
                  file.localId === localId ? {...file, progress} : file,
                ),
              );
            },
          },
        );

        showToast({
          variant: 'success',
          text: t('toasts.fileDownloadSuccess', {
            fileName: savedFile.fileName,
            locationLabel: savedFile.locationLabel,
          }),
        });
      } catch {
        showToast({variant: 'error', text: t('toasts.fileDownloadError')});
      } finally {
        setFiles(prev =>
          prev.map(file =>
            file.localId === localId
              ? {...file, isDownloading: false, progress: undefined}
              : file,
          ),
        );
      }
    },
    [files, showToast, t],
  );

  useEffect(() => {
    return () => {
      abortControllersRef.current.forEach(controller => {
        controller.abort();
      });
      abortControllersRef.current.clear();
    };
  }, []);

  useEffect(() => {
    if (hasAllFormDosageValues(releaseDosage)) {
      setIsFormDosageError(false);
    }
  }, [releaseDosage]);

  useEffect(() => {
    if (isRegimenConfigured(regimen)) {
      setIsRegimenError(false);
    }
  }, [regimen]);

  const saveButtonBottom = insets.bottom + SAVE_BUTTON_BOTTOM_OFFSET;
  const filesActionButtonBottom =
    saveButtonBottom + SAVE_BUTTON_HEIGHT + FILES_ACTION_BUTTON_BOTTOM_SPACING;
  const baseScrollBottomPadding =
    insets.bottom +
    SAVE_BUTTON_BOTTOM_OFFSET +
    SAVE_BUTTON_HEIGHT +
    SAVE_BUTTON_TOP_SPACING;
  const filesActionExtraPadding =
    FILES_ACTION_BUTTON_SIZE +
    FILES_ACTION_BUTTON_BOTTOM_SPACING -
    SAVE_BUTTON_TOP_SPACING;
  const scrollBottomPadding =
    baseScrollBottomPadding + (isFilesTab ? filesActionExtraPadding : 0);

  const handleSavePress = async () => {
    const trimmedDrugName = drugName.trim();
    const hasDrugName = Boolean(trimmedDrugName);
    const hasFormDosage = hasAllFormDosageValues(releaseDosage);
    const hasRegimen = isRegimenConfigured(regimen);

    if (!hasDrugName || !hasFormDosage || !hasRegimen) {
      setSelectedTabId('general');
      setIsDrugNameError(!hasDrugName);
      setIsFormDosageError(!hasFormDosage);
      setIsRegimenError(!hasRegimen);
      setSaveValidationAttempt(prev => prev + 1);
      return;
    }

    if (isEditMode && prescriptionId) {
      let updatePayload: UpdateMedicationPrescriptionDto;

      try {
        updatePayload = buildUpdateMedicationPrescriptionPayload({
          drugName: trimmedDrugName,
          note,
          isReminderEnabled,
          releaseDosage,
          regimen,
          notifications,
          files: buildFileAttachments(files),
          medicationId: medicationIdRef.current,
          medicationName: medicationNameRef.current,
        });
      } catch {
        showToast({variant: 'error', text: t('toasts.saveServerError')});
        return;
      }

      const hasChanges =
        initialPayloadJsonRef.current == null ||
        JSON.stringify(updatePayload) !== initialPayloadJsonRef.current;

      try {
        const mealReminderSynced = await syncMealsRegimenBeforeSave();

        if (!hasChanges) {
          if (mealReminderSynced) {
            showToast({variant: 'success', text: t('toasts.updateSuccess')});
          }
          skipOrphanFileCleanupRef.current = true;
          navigation.goBack();
          void queryClient.invalidateQueries({queryKey: MEAL_SCHEDULE_QUERY_KEY});
          return;
        }

        await updateDrugPrescriptionMutation({id: prescriptionId, payload: updatePayload});
        showToast({variant: 'success', text: t('toasts.updateSuccess')});
        skipOrphanFileCleanupRef.current = true;
        navigation.goBack();
        void queryClient.invalidateQueries({queryKey: MEDICATION_PRESCRIPTIONS_QUERY_KEY});
        void queryClient.invalidateQueries({queryKey: CALENDAR_QUERY_KEY});
        void queryClient.invalidateQueries({queryKey: MEAL_SCHEDULE_QUERY_KEY});
        void invalidateDocumentsQueries(queryClient);
      } catch {
        showToast({variant: 'error', text: t('toasts.saveServerError')});
      }
      return;
    }

    const createInput = {
      drugName: trimmedDrugName,
      note,
      isReminderEnabled,
      releaseDosage,
      regimen,
      notifications,
      files: buildFileAttachments(files),
    };

    try {
      await syncMealsRegimenBeforeSave();

      const payload = buildCreateMedicationPrescriptionPayload(createInput);
      await createDrugPrescriptionMutation(payload);

      showToast({variant: 'success', text: t('toasts.saveSuccess')});
      skipOrphanFileCleanupRef.current = true;
      dispatch(resetDrugsCreateState());
      navigation.goBack();
      void queryClient.invalidateQueries({queryKey: MEDICATION_PRESCRIPTIONS_QUERY_KEY});
      void queryClient.invalidateQueries({queryKey: CALENDAR_QUERY_KEY});
      void queryClient.invalidateQueries({queryKey: MEAL_SCHEDULE_QUERY_KEY});
      void invalidateDocumentsQueries(queryClient);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        showToast({variant: 'error', text: t('toasts.saveServerError')});
        return;
      }

      showToast({variant: 'error', text: t('toasts.saveServerError')});
    }
  };

  const generalTab = {
    id: 'general',
    title: t('tabs.generalInfo'),
    content: (
      <ScrollView
        style={styles.generalTabScroll}
        contentContainerStyle={[
          styles.generalTabScrollContent,
          {paddingBottom: scrollBottomPadding},
        ]}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled>
        <DrugsCreateInfoTab
          drugName={drugName}
          note={note}
          isDrugNameError={isDrugNameError}
          isFormDosageError={isFormDosageError}
          isRegimenError={isRegimenError}
          saveValidationAttempt={saveValidationAttempt}
          isReminderEnabled={isReminderEnabled}
          onReminderEnabledChange={setIsReminderEnabled}
          onDrugNameErrorAnimationEnd={() => {
            setIsDrugNameError(false);
          }}
          onFormDosageErrorAnimationEnd={() => {
            setIsFormDosageError(false);
          }}
          onRegimenErrorAnimationEnd={() => {
            setIsRegimenError(false);
          }}
          onDrugNameSave={value => {
            setDrugName(value);
            if (value.trim()) {
              setIsDrugNameError(false);
            }
          }}
          onNoteSave={setNote}
          shouldOpenNameModal={shouldOpenNameModal}
          onNameModalShown={() => {
            setShouldOpenNameModal(false);
          }}
        />
      </ScrollView>
    ),
  } as const;

  const filesTab = {
    id: 'files',
    title: t('tabs.files'),
    content: (
      <DrugsCreateFilesTab
        files={files}
        onCancelUpload={handleCancelUpload}
        onRetryUpload={handleRetryUpload}
        onDeleteFile={handleDeleteFile}
        onDownloadFile={handleDownloadFile}
        contentPaddingBottom={scrollBottomPadding}
      />
    ),
  } as const;

  const intakesTab = {
    id: 'intakes',
    title: t('tabs.intakes'),
    keepMounted: keepIntakesTabMounted,
    content:
      isEditMode && prescriptionId && prescriptionData &&
      (keepIntakesTabMounted || selectedTabId === 'intakes') ? (
        <DrugsCreateCalendarTab
          prescriptionId={prescriptionId}
          startDateIso={prescriptionData.startDate}
          durationDays={prescriptionData.durationDays ?? 1}
          searchName={medicationNameRef.current || drugName}
          initialMonth={initialCalendarMonth}
          initialYear={initialCalendarYear}
          openIntakeId={openIntakeId}
          onOpenIntakeHandled={() => setOpenIntakeId(undefined)}
        />
      ) : null,
  } as const;

  const drugsCreateTabs = isEditMode
    ? ([generalTab, intakesTab, filesTab] as const)
    : ([generalTab, filesTab] as const);

  if (isEditMode && (!isHydrated || isLoadingPrescription)) {
    return (
      <StatusBarAvoidContainer backgroundColor="rgba(247, 246, 251, 1)">
        <Header
          title={t('screenTitles.profile')}
          backgroundColor="rgba(247, 246, 251, 1)"
        />
        <DrugsCreateSkeleton />
      </StatusBarAvoidContainer>
    );
  }

  return (
    <StatusBarAvoidContainer backgroundColor="rgba(247, 246, 251, 1)">
      <Header
        title={t('screenTitles.profile')}
        backgroundColor="rgba(247, 246, 251, 1)"
        rightIcon={isEditMode ? 'trash-2' : undefined}
        onRightIconPress={isEditMode ? handleDeletePress : undefined}
      />
      <View style={styles.screenContent}>
        <View style={styles.scroll}>
          <Tabs
            style={styles.tabsContainer}
            tabs={drugsCreateTabs}
            selectedTabId={selectedTabId}
            stretchContent
            contentContainerStyle={
              isFilesTab
                ? styles.filesTabContent
                : isIntakesTab
                  ? styles.intakesTabContent
                  : styles.generalTabContent
            }
            onTabChange={tabId => {
              setSelectedTabId(tabId);
              if (tabId === 'intakes') {
                setKeepIntakesTabMounted(true);
              }
            }}
          />
        </View>
        {isFilesTab &&
          <CircleIconButton
            icon="file-plus-corner"
            onPress={() => addFileModalRef.current?.present()}
            style={[styles.filesActionButton, {bottom: filesActionButtonBottom}]}
          />
        }
        <AddFileModal
          ref={addFileModalRef}
          onFileSelected={handleFileSelected}
        />
        {isEditMode ? (
          <DrugDeleteModal
            ref={deleteDrugModalRef}
            onConfirmDelete={handleConfirmDelete}
          />
        ) : null}
        {!isIntakesTab && (
          <ButtonMain
            title={t('modals.save')}
            onPress={() => {
              void handleSavePress();
            }}
            isLoading={isSaving}
            style={[styles.saveButton, {bottom: saveButtonBottom}]}
          />
        )}
      </View>
    </StatusBarAvoidContainer>
  );
};

const styles = StyleSheet.create({
  screenContent: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  tabsContainer: {
    marginHorizontal: 12,
    marginTop: TABS_TOP_MARGIN,
  },
  scrollContent: {
    flexGrow: 1,
  },
  generalTabContent: {
    flex: 1,
    minHeight: 0,
    alignSelf: 'stretch',
  },
  generalTabScroll: {
    flex: 1,
  },
  generalTabScrollContent: {
    flexGrow: 1,
  },
  filesTabContent: {
    flex: 1,
    minHeight: 0,
    alignSelf: 'stretch',
  },
  intakesTabContent: {
    flex: 1,
    minHeight: 0,
    alignSelf: 'stretch',
  },
  filesActionButton: {
    position: 'absolute',
    right: 12,
    zIndex: 2,
  },
  saveButton: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 2,
  },
});
