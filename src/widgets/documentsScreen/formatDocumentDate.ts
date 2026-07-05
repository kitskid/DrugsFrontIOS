import type {TFunction} from 'i18next';

const MONTH_KEYS = [
  'jan',
  'feb',
  'mar',
  'apr',
  'may',
  'jun',
  'jul',
  'aug',
  'sep',
  'oct',
  'nov',
  'dec',
] as const;

export const formatDocumentUploadedDate = (
  uploadedAt: string,
  tTimePickers: TFunction<'timePickers'>,
): string => {
  const date = new Date(uploadedAt);
  const day = String(date.getDate()).padStart(2, '0');
  const month = tTimePickers(`months.${MONTH_KEYS[date.getMonth()]}`);
  const year = date.getFullYear();

  return `${day} ${month} ${year}`;
};
