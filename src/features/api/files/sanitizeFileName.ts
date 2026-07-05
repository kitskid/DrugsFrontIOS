const CYRILLIC_TO_LATIN: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z',
  и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
  с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'c', ч: 'ch', ш: 'sh', щ: 'sch',
  ь: '', ы: 'y', ъ: '', э: 'e', ю: 'yu', я: 'ya',
  А: 'A', Б: 'B', В: 'V', Г: 'G', Д: 'D', Е: 'E', Ё: 'E', Ж: 'Zh', З: 'Z',
  И: 'I', Й: 'Y', К: 'K', Л: 'L', М: 'M', Н: 'N', О: 'O', П: 'P', Р: 'R',
  С: 'S', Т: 'T', У: 'U', Ф: 'F', Х: 'H', Ц: 'C', Ч: 'Ch', Ш: 'Sh', Щ: 'Sch',
  Ь: '', Ы: 'Y', Ъ: '', Э: 'E', Ю: 'Yu', Я: 'Ya',
};

export const transliterateCyrillicToLatin = (text: string): string => {
  let out = '';

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    out += CYRILLIC_TO_LATIN[ch] ?? ch;
  }

  return out;
};

export const getNotEmptyFileName = (
  name: string | null | undefined,
  fallback: string,
): string => {
  const value = name == null ? '' : String(name).trim();
  return value || fallback;
};

export const sanitizeFileName = (name: string): string => {
  const value = name
    .replace(/\s+/g, '_')
    .replace(/[^\w.-]/g, '_')
    .replace(/__+/g, '_')
    .replace(/^_+|_+$/g, '');

  return value || 'upload.bin';
};

export const prepareFileNameForCache = (
  raw: string | null | undefined,
  emptyFallback = 'upload.bin',
): string => {
  const nonEmpty = getNotEmptyFileName(raw, emptyFallback);
  const noLeadingDots = nonEmpty.replace(/^\.+/, '') || emptyFallback;
  const translit = transliterateCyrillicToLatin(noLeadingDots);
  const ascii = translit.replace(/[^\u0020-\u007E]/g, '').trim() || 'file';

  return sanitizeFileName(ascii);
};

export const sanitizeLogicalFileNameForUpload = (
  raw: string | null | undefined,
  emptyFallback = 'upload.bin',
): string => {
  const nonEmpty = getNotEmptyFileName(raw, emptyFallback);
  const noLeadingDots = nonEmpty.replace(/^\.+/, '') || emptyFallback;
  const cleaned = noLeadingDots.replace(/[\x00-\x1f\x7f\\/]/g, '_').trim();

  return cleaned || emptyFallback;
};
