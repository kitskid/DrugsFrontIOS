import EyeIcon from '../../../assets/icons/eye.svg';
import EyeOffIcon from '../../../assets/icons/eye-off.svg';
import CheckIcon from '../../../assets/icons/check.svg';
import InfoIcon from '../../../assets/icons/info.svg';
import MailIcon from '../../../assets/icons/mail.svg';
import LockKeyholeIcon from '../../../assets/icons/lock-keyhole.svg';
import DeleteIcon from '../../../assets/icons/delete.svg';
import CircleUserIcon from '../../../assets/icons/circle-user.svg';
import XIcon from '../../../assets/icons/x.svg';
import HomeFilledIcon from '../../../assets/icons/home-filled.svg';
import HomeOutlineIcon from '../../../assets/icons/home-outline.svg';
import PillFilledIcon from '../../../assets/icons/pill-filled.svg';
import PillOutlineIcon from '../../../assets/icons/pill-outline.svg';
import CalendarEventFilledIcon from '../../../assets/icons/calendar-event-filled.svg';
import CalendarEventOutlineIcon from '../../../assets/icons/calendar-event-outline.svg';
import UserFilledIcon from '../../../assets/icons/user-filled.svg';
import UserOutlineIcon from '../../../assets/icons/user-outline.svg';
import PillPlusNewIcon from '../../../assets/icons/pill-plus-new.svg';
import ClockPlusIcon from '../../../assets/icons/clock-plus.svg';
import ChevronLeftIcon from '../../../assets/icons/chevron-left.svg';
import ChevronRightIcon from '../../../assets/icons/chevron-right.svg';
import ChevronDownIcon from '../../../assets/icons/chevron-down.svg';
import TriangleAlertIcon from '../../../assets/icons/triangle-alert.svg';
import Calendar1Icon from '../../../assets/icons/calendar-1.svg';
import CalendarPlusIcon from '../../../assets/icons/calendar-plus.svg';
import SquarePenIcon from '../../../assets/icons/square-pen.svg';
import Trash2Icon from '../../../assets/icons/trash-2.svg';
import BellIcon from '../../../assets/icons/bell.svg';
import BellSearchIcon from '../../../assets/icons/bell-search.svg';
import PlusIcon from '../../../assets/icons/plus.svg';
import FilePlusCornerIcon from '../../../assets/icons/file-plus-corner.svg';
import FileSearchCornerIcon from '../../../assets/icons/file-search-corner.svg';
import MoonIcon from '../../../assets/icons/moon.svg';
import FileTextIcon from '../../../assets/icons/file-text.svg';
import LogOutIcon from '../../../assets/icons/log-out.svg';
import LanguagesIcon from '../../../assets/icons/languages.svg';
import BanIcon from '../../../assets/icons/ban.svg';
import DownloadIcon from '../../../assets/icons/download.svg';
import SearchIcon from '../../../assets/icons/search.svg';
import FileTypePdfIcon from '../../../assets/icons/file-type-pdf.svg';
import FileTypeDocxIcon from '../../../assets/icons/file-type-docx.svg';
import FileTypeDocIcon from '../../../assets/icons/file-type-doc.svg';
import FileTypeJpgIcon from '../../../assets/icons/file-type-jpg.svg';
import FileTypePngIcon from '../../../assets/icons/file-type-png.svg';
import FileTypeTxtIcon from '../../../assets/icons/file-type-txt.svg';
import FileTypeZipIcon from '../../../assets/icons/file-type-zip.svg';
import FileIcon from '../../../assets/icons/file.svg';
import RefreshCcwIcon from '../../../assets/icons/refresh-ccw.svg';
import PillSearchIcon from '../../../assets/icons/pill-search.svg';
import CalendarSearchIcon from '../../../assets/icons/calendar-search.svg';
import MealsIcon from '../../../assets/icons/meals.svg';
import LinesPlusIcon from '../../../assets/icons/lines-plus.svg';

export type IconName =
  | 'eye'
  | 'eye-off'
  | 'check'
  | 'lock-keyhole'
  | 'mail'
  | 'info'
  | 'delete'
  | 'circle-user'
  | 'x'
  | 'home-filled'
  | 'home-outline'
  | 'pill-filled'
  | 'pill-outline'
  | 'calendar-event-filled'
  | 'calendar-event-outline'
  | 'user-filled'
  | 'user-outline'
  | 'pill-plus-new'
  | 'clock-plus'
  | 'chevron-left'
  | 'chevron-right'
  | 'chevron-down'
  | 'triangle-alert'
  | 'calendar-1'
  | 'calendar-plus'
  | 'square-pen'
  | 'trash-2'
  | 'bell'
  | 'bell-search'
  | 'plus'
  | 'file-plus-corner'
  | 'file-search-corner'
  | 'moon'
  | 'file-text'
  | 'log-out'
  | 'languages'
  | 'ban'
  | 'download'
  | 'search'
  | 'file-type-pdf'
  | 'file-type-docx'
  | 'file-type-doc'
  | 'file-type-jpg'
  | 'file-type-png'
  | 'file-type-txt'
  | 'file-type-zip'
  | 'file'
  | 'refresh-ccw'
  | 'pill-search'
  | 'calendar-search'
  | 'meals'
  | 'lines-plus';

type IconMapperProps = {
  icon: IconName;
  size?: number;
  color?: string;
  weight?: number;
};

const iconMap = {
  eye: EyeIcon,
  'eye-off': EyeOffIcon,
  check: CheckIcon,
  info: InfoIcon,
  mail: MailIcon,
  'lock-keyhole': LockKeyholeIcon,
  delete: DeleteIcon,
  'circle-user': CircleUserIcon,
  x: XIcon,
  'home-filled': HomeFilledIcon,
  'home-outline': HomeOutlineIcon,
  'pill-filled': PillFilledIcon,
  'pill-outline': PillOutlineIcon,
  'calendar-event-filled': CalendarEventFilledIcon,
  'calendar-event-outline': CalendarEventOutlineIcon,
  'user-filled': UserFilledIcon,
  'user-outline': UserOutlineIcon,
  'pill-plus-new': PillPlusNewIcon,
  'clock-plus': ClockPlusIcon,
  'chevron-left': ChevronLeftIcon,
  'chevron-right': ChevronRightIcon,
  'chevron-down': ChevronDownIcon,
  'triangle-alert': TriangleAlertIcon,
  'calendar-1': Calendar1Icon,
  'calendar-plus': CalendarPlusIcon,
  'square-pen': SquarePenIcon,
  'trash-2': Trash2Icon,
  bell: BellIcon,
  'bell-search': BellSearchIcon,
  plus: PlusIcon,
  'file-plus-corner': FilePlusCornerIcon,
  'file-search-corner': FileSearchCornerIcon,
  moon: MoonIcon,
  'file-text': FileTextIcon,
  'log-out': LogOutIcon,
  languages: LanguagesIcon,
  ban: BanIcon,
  download: DownloadIcon,
  search: SearchIcon,
  'file-type-pdf': FileTypePdfIcon,
  'file-type-docx': FileTypeDocxIcon,
  'file-type-doc': FileTypeDocIcon,
  'file-type-jpg': FileTypeJpgIcon,
  'file-type-png': FileTypePngIcon,
  'file-type-txt': FileTypeTxtIcon,
  'file-type-zip': FileTypeZipIcon,
  file: FileIcon,
  'refresh-ccw': RefreshCcwIcon,
  'pill-search': PillSearchIcon,
  'calendar-search': CalendarSearchIcon,
  meals: MealsIcon,
  'lines-plus': LinesPlusIcon,
} as const;

const ICONS_WITH_DEFAULT_WEIGHT: ReadonlySet<IconName> = new Set([
  'pill-plus-new',
  'clock-plus',
  'chevron-left',
  'chevron-right',
  'chevron-down',
  'calendar-1',
  'calendar-plus',
  'square-pen',
  'trash-2',
  'bell',
  'bell-search',
  'plus',
  'file-plus-corner',
  'file-search-corner',
  'moon',
  'file-text',
  'log-out',
  'languages',
  'ban',
  'download',
  'search',
  'file-type-pdf',
  'file-type-docx',
  'file-type-doc',
  'file-type-jpg',
  'file-type-png',
  'file-type-txt',
  'file-type-zip',
  'file',
  'refresh-ccw',
  'pill-search',
  'calendar-search',
  'meals',
  'lines-plus',
]);

export const IconMapper = ({
  icon,
  size = 18,
  color = 'rgba(29, 26, 73, 0.6)',
  weight,
}: IconMapperProps) => {
  const IconComponent = iconMap[icon];
  const resolvedWeight = weight ?? (ICONS_WITH_DEFAULT_WEIGHT.has(icon) ? 1.5 : undefined);

  return (
    <IconComponent
      width={size}
      height={size}
      color={color}
      strokeWidth={resolvedWeight}
    />
  );
};
