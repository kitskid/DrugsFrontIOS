export const releaseFormOptionKeys = [
  'capsules',
  'pills',
  'dragee',
  'tablets',
  'granules',
  'powder',
  'lozenges',
] as const;

export const dosageUnitOptionKeys = ['mg', 'g', 'ml', 'l', 'drops', 'pcs', 'iu'] as const;

export type ReleaseFormKey = (typeof releaseFormOptionKeys)[number];
export type DosageUnitKey = (typeof dosageUnitOptionKeys)[number];

/**
 * Allowed dosage units per release form.
 * Solid oral forms use mass or piece count; powders/granules may also use volume after dilution.
 * Liters are excluded — they are not used for a single dose.
 */
export const ALLOWED_DOSAGE_UNITS_BY_RELEASE_FORM: Record<
  ReleaseFormKey,
  readonly DosageUnitKey[]
> = {
  capsules: ['mg', 'g', 'pcs', 'iu'],
  pills: ['mg', 'g', 'pcs', 'iu'],
  dragee: ['mg', 'g', 'pcs'],
  tablets: ['mg', 'g', 'pcs', 'iu'],
  granules: ['mg', 'g', 'ml', 'drops', 'pcs', 'iu'],
  powder: ['mg', 'g', 'ml', 'drops', 'pcs', 'iu'],
  lozenges: ['mg', 'g', 'pcs'],
};

const normalizeOptionValue = (value: string): string => value.trim().toLowerCase();

export const resolveReleaseFormKey = (
  value: string,
  getLabel: (key: ReleaseFormKey) => string,
): ReleaseFormKey | null => {
  const normalized = normalizeOptionValue(value);
  if (!normalized) {
    return null;
  }

  const byKey = releaseFormOptionKeys.find(key => normalizeOptionValue(key) === normalized);
  if (byKey) {
    return byKey;
  }

  return (
    releaseFormOptionKeys.find(
      key => normalizeOptionValue(getLabel(key)) === normalized,
    ) ?? null
  );
};

export const resolveDosageUnitKey = (
  value: string,
  getLabel: (key: DosageUnitKey) => string,
): DosageUnitKey | null => {
  const normalized = normalizeOptionValue(value);
  if (!normalized) {
    return null;
  }

  const byKey = dosageUnitOptionKeys.find(key => normalizeOptionValue(key) === normalized);
  if (byKey) {
    return byKey;
  }

  return (
    dosageUnitOptionKeys.find(
      key => normalizeOptionValue(getLabel(key)) === normalized,
    ) ?? null
  );
};

export const isDosageUnitAllowedForReleaseForm = (
  releaseFormKey: ReleaseFormKey,
  dosageUnitKey: DosageUnitKey,
): boolean => ALLOWED_DOSAGE_UNITS_BY_RELEASE_FORM[releaseFormKey].includes(dosageUnitKey);

export const getAllowedDosageUnitKeys = (
  releaseFormKey: ReleaseFormKey | null,
): readonly DosageUnitKey[] =>
  releaseFormKey ? ALLOWED_DOSAGE_UNITS_BY_RELEASE_FORM[releaseFormKey] : [];

/** Maps a stored release form value to the canonical localized option label. */
export const resolveReleaseFormDisplayValue = (
  value: string,
  getLabel: (key: ReleaseFormKey) => string,
): string => {
  const key = resolveReleaseFormKey(value, getLabel);
  if (key) {
    return getLabel(key);
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
};
