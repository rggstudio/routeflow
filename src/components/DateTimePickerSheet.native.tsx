import { useEffect, useState } from 'react';
import { Modal, Platform, Pressable, Text, View } from 'react-native';
import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';

import { BottomSheetScreen } from '@/components/BottomSheetScreen';

type PickerMode = 'date' | 'time';

type DateTimePickerSheetProps = {
  visible: boolean;
  mode: PickerMode;
  title: string;
  value: Date;
  onCancel: () => void;
  onConfirm: (value: Date) => void;
};

export function DateTimePickerSheet({
  visible,
  mode,
  title,
  value,
  onCancel,
  onConfirm,
}: DateTimePickerSheetProps) {
  const [iosValue, setIosValue] = useState(value);

  useEffect(() => {
    if (visible) {
      setIosValue(value);
    }
  }, [value, visible]);

  useEffect(() => {
    if (!visible || Platform.OS !== 'android') {
      return;
    }

    DateTimePickerAndroid.open({
      mode,
      value,
      is24Hour: false,
      display: mode === 'date' ? 'calendar' : 'spinner',
      onChange: (event: DateTimePickerEvent, selectedDate?: Date) => {
        if (event.type === 'set' && selectedDate) {
          onConfirm(selectedDate);
          return;
        }

        onCancel();
      },
    });
  }, [mode, onCancel, onConfirm, value, visible]);

  if (Platform.OS === 'android' || !visible) {
    return null;
  }

  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onCancel}>
      <BottomSheetScreen onClose={onCancel}>
        <View className="pb-8">
          <View className="mb-5 flex-row items-center justify-between">
            <Pressable className="rounded-full px-3 py-2 active:opacity-80" onPress={onCancel}>
              <Text className="font-medium text-slate-300">Cancel</Text>
            </Pressable>
            <Text className="text-base font-semibold text-white">{title}</Text>
            <Pressable
              className="rounded-full bg-cyan-400 px-4 py-2 active:opacity-80"
              onPress={() => onConfirm(iosValue)}
            >
              <Text className="font-semibold text-slate-950">Done</Text>
            </Pressable>
          </View>

          <DateTimePicker
            value={iosValue}
            mode={mode}
            display={mode === 'date' ? 'inline' : 'spinner'}
            onChange={(_event, selectedDate) => {
              if (selectedDate) {
                setIosValue(selectedDate);
              }
            }}
          />
        </View>
      </BottomSheetScreen>
    </Modal>
  );
}
