import { useCallback, useEffect, useState } from 'react';
import { Alert, Modal, Platform, Pressable, Text, View } from 'react-native';
import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';

import { BottomSheetScreen } from '@/components/BottomSheetScreen';
import { formatTime, timeToMinutes } from '@/lib/date';

type PickerMode = 'date' | 'time';

type DateTimePickerSheetProps = {
  visible: boolean;
  mode: PickerMode;
  title: string;
  value: Date;
  timeConfig?: {
    minuteInterval?: number;
    minimumTime?: string;
    maximumTime?: string;
  };
  onCancel: () => void;
  onConfirm: (value: Date) => void;
};
type SupportedMinuteInterval = 1 | 2 | 3 | 4 | 5 | 6 | 10 | 12 | 15 | 20 | 30;

function isTimeSelectionAllowed(value: Date, timeConfig?: DateTimePickerSheetProps['timeConfig']) {
  if (!timeConfig) {
    return true;
  }

  const selectedMinutes = value.getHours() * 60 + value.getMinutes();
  const minimumMinutes = timeConfig.minimumTime ? timeToMinutes(timeConfig.minimumTime) : null;
  const maximumMinutes = timeConfig.maximumTime ? timeToMinutes(timeConfig.maximumTime) : null;

  if (minimumMinutes !== null && selectedMinutes < minimumMinutes) {
    return false;
  }

  if (maximumMinutes !== null && selectedMinutes > maximumMinutes) {
    return false;
  }

  return true;
}

function getInvalidTimeMessage(timeConfig?: DateTimePickerSheetProps['timeConfig']) {
  if (timeConfig?.minimumTime && timeConfig.maximumTime) {
    return `Choose a time between ${formatTime(timeConfig.minimumTime)} and ${formatTime(
      timeConfig.maximumTime
    )}.`;
  }

  if (timeConfig?.minimumTime) {
    return `Choose a time at or after ${formatTime(timeConfig.minimumTime)}.`;
  }

  if (timeConfig?.maximumTime) {
    return `Choose a time at or before ${formatTime(timeConfig.maximumTime)}.`;
  }

  return 'Choose a valid time.';
}

export function DateTimePickerSheet({
  visible,
  mode,
  title,
  value,
  timeConfig,
  onCancel,
  onConfirm,
}: DateTimePickerSheetProps) {
  const [iosValue, setIosValue] = useState(value);

  const confirmSelection = useCallback(
    (selectedValue: Date, closeOnInvalid = false) => {
      if (mode === 'time' && !isTimeSelectionAllowed(selectedValue, timeConfig)) {
        Alert.alert('Invalid time', getInvalidTimeMessage(timeConfig));

        if (closeOnInvalid) {
          onCancel();
        }

        return;
      }

      onConfirm(selectedValue);
    },
    [mode, onCancel, onConfirm, timeConfig]
  );

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
          confirmSelection(selectedDate, true);
          return;
        }

        onCancel();
      },
    });
  }, [confirmSelection, mode, onCancel, value, visible]);

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
              onPress={() => confirmSelection(iosValue)}
            >
              <Text className="font-semibold text-slate-950">Done</Text>
            </Pressable>
          </View>

          <DateTimePicker
            value={iosValue}
            mode={mode}
            display={mode === 'date' ? 'inline' : 'spinner'}
            minuteInterval={
              mode === 'time'
                ? (timeConfig?.minuteInterval as SupportedMinuteInterval | undefined)
                : undefined
            }
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
