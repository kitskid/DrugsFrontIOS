import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import {IconMapper} from '../../../shared/ui/IconMapper.tsx';
import {TimePickerMain} from '../../../shared/ui/timePickers/TimePickerMain.tsx';

type MealUnitCardProps = {
  name: string;
  time: string;
  timePickerModalTitle: string;
  onTimeChange: (time: string) => void;
  onEdit: () => void;
  onDelete: () => void;
  isDeleteLoading?: boolean;
  style?: StyleProp<ViewStyle>;
};

const ICON_COLOR = 'rgba(199, 198, 217, 1)';
const LOADER_COLOR = 'rgba(35, 142, 235, 1)';

export const MealUnitCard = ({
  name,
  time,
  timePickerModalTitle,
  onTimeChange,
  onEdit,
  onDelete,
  isDeleteLoading = false,
  style,
}: MealUnitCardProps) => {
  return (
    <View style={[styles.card, style]}>
      <View style={styles.header}>
        <Text style={styles.name}>{name}</Text>
        <View style={styles.actions}>
          <TouchableOpacity activeOpacity={0.7} hitSlop={6} onPress={onEdit}>
            <IconMapper icon="square-pen" size={24} color={ICON_COLOR} weight={1.5} />
          </TouchableOpacity>
          <View style={styles.deleteButtonSlot}>
            {isDeleteLoading ? (
              <ActivityIndicator size="large" color={LOADER_COLOR} />
            ) : (
              <TouchableOpacity activeOpacity={0.7} hitSlop={6} onPress={onDelete}>
                <IconMapper icon="trash-2" size={24} color={ICON_COLOR} weight={1.5} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
      <TimePickerMain
        value={time}
        onChange={onTimeChange}
        modalTitle={timePickerModalTitle}
        style={styles.timePicker}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 255, 255, 1)',
    borderRadius: 28,
    paddingHorizontal: 12,
    paddingVertical: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    justifyContent: 'space-between',
  },
  name: {
    flex: 1,
    marginLeft: 16,
    color: 'rgba(29, 26, 73, 1)',
    fontSize: 18,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  deleteButtonSlot: {
    width: 24,
    height: 24,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timePicker: {
    marginTop: 16,
  },
});
