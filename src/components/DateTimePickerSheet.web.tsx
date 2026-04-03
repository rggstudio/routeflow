import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

import { BottomSheetScreen } from '@/components/BottomSheetScreen';
import { PillButton } from '@/components/ui';

type PickerMode = 'date' | 'time';

type DateTimePickerSheetProps = {
  visible: boolean;
  mode: PickerMode;
  title: string;
  value: Date;
  onCancel: () => void;
  onConfirm: (value: Date) => void;
};

const monthFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  year: 'numeric',
});

const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const minuteOptions = Array.from({ length: 12 }, (_, index) => `${index * 5}`.padStart(2, '0'));
const hourOptions = Array.from({ length: 12 }, (_, index) => `${index + 1}`);

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function buildCalendarDays(month: Date) {
  const firstDay = startOfMonth(month);
  const firstWeekday = firstDay.getDay();
  const start = new Date(firstDay);
  start.setDate(firstDay.getDate() - firstWeekday);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}

function get12HourParts(value: Date) {
  const hours24 = value.getHours();
  const minutes = `${value.getMinutes()}`.padStart(2, '0');
  const meridiem = hours24 >= 12 ? 'PM' : 'AM';
  const hour = hours24 % 12 || 12;

  return {
    hour: `${hour}`,
    minutes,
    meridiem,
  };
}

function applyTimeParts(baseDate: Date, hour: string, minutes: string, meridiem: 'AM' | 'PM') {
  const next = new Date(baseDate);
  let hours = Number(hour) % 12;

  if (meridiem === 'PM') {
    hours += 12;
  }

  next.setHours(hours, Number(minutes), 0, 0);
  return next;
}

export function DateTimePickerSheet({
  visible,
  mode,
  title,
  value,
  onCancel,
  onConfirm,
}: DateTimePickerSheetProps) {
  const [draftDate, setDraftDate] = useState(value);
  const [visibleMonth, setVisibleMonth] = useState(startOfMonth(value));
  const [timeHour, setTimeHour] = useState(get12HourParts(value).hour);
  const [timeMinutes, setTimeMinutes] = useState(get12HourParts(value).minutes);
  const [timeMeridiem, setTimeMeridiem] = useState<'AM' | 'PM'>(get12HourParts(value).meridiem as 'AM' | 'PM');

  useEffect(() => {
    if (!visible) {
      return;
    }

    setDraftDate(value);
    setVisibleMonth(startOfMonth(value));

    const parts = get12HourParts(value);
    setTimeHour(parts.hour);
    setTimeMinutes(parts.minutes);
    setTimeMeridiem(parts.meridiem as 'AM' | 'PM');
  }, [value, visible]);

  const calendarDays = useMemo(() => buildCalendarDays(visibleMonth), [visibleMonth]);

  if (!visible) {
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
              onPress={() =>
                onConfirm(
                  mode === 'date'
                    ? draftDate
                    : applyTimeParts(draftDate, timeHour, timeMinutes, timeMeridiem)
                )
              }
            >
              <Text className="font-semibold text-slate-950">Done</Text>
            </Pressable>
          </View>

          {mode === 'date' ? (
            <View>
              <View className="mb-4 flex-row items-center justify-between">
                <Pressable
                  className="rounded-full bg-white/5 px-4 py-2 active:opacity-80"
                  onPress={() =>
                    setVisibleMonth(
                      new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1)
                    )
                  }
                >
                  <Text className="font-medium text-slate-300">Prev</Text>
                </Pressable>
                <Text className="text-lg font-semibold text-white">
                  {monthFormatter.format(visibleMonth)}
                </Text>
                <Pressable
                  className="rounded-full bg-white/5 px-4 py-2 active:opacity-80"
                  onPress={() =>
                    setVisibleMonth(
                      new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1)
                    )
                  }
                >
                  <Text className="font-medium text-slate-300">Next</Text>
                </Pressable>
              </View>

              <View className="mb-3 flex-row">
                {weekdayLabels.map((label) => (
                  <View key={label} className="flex-1 items-center py-2">
                    <Text className="text-xs font-semibold uppercase tracking-[1.2px] text-slate-500">
                      {label}
                    </Text>
                  </View>
                ))}
              </View>

              <View className="flex-row flex-wrap">
                {calendarDays.map((day) => {
                  const inMonth = day.getMonth() === visibleMonth.getMonth();
                  const selected = sameDay(day, draftDate);

                  return (
                    <Pressable
                      key={day.toISOString()}
                      className="w-[14.28%] p-1 active:opacity-80"
                      onPress={() => setDraftDate(day)}
                    >
                      <View
                        className={`items-center rounded-2xl py-3 ${
                          selected ? 'bg-cyan-400' : inMonth ? 'bg-white/5' : 'bg-transparent'
                        }`}
                      >
                        <Text
                          className={`font-medium ${
                            selected
                              ? 'text-slate-950'
                              : inMonth
                                ? 'text-white'
                                : 'text-slate-600'
                          }`}
                        >
                          {day.getDate()}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="gap-5">
                <View>
                  <Text className="mb-3 text-sm font-medium text-slate-300">Hour</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {hourOptions.map((hour) => (
                      <PillButton
                        key={hour}
                        label={hour}
                        selected={timeHour === hour}
                        onPress={() => setTimeHour(hour)}
                      />
                    ))}
                  </View>
                </View>

                <View>
                  <Text className="mb-3 text-sm font-medium text-slate-300">Minutes</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {minuteOptions.map((minutes) => (
                      <PillButton
                        key={minutes}
                        label={minutes}
                        selected={timeMinutes === minutes}
                        onPress={() => setTimeMinutes(minutes)}
                      />
                    ))}
                  </View>
                </View>

                <View>
                  <Text className="mb-3 text-sm font-medium text-slate-300">AM / PM</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {(['AM', 'PM'] as const).map((valueLabel) => (
                      <PillButton
                        key={valueLabel}
                        label={valueLabel}
                        selected={timeMeridiem === valueLabel}
                        onPress={() => setTimeMeridiem(valueLabel)}
                      />
                    ))}
                  </View>
                </View>
              </View>
            </ScrollView>
          )}
        </View>
      </BottomSheetScreen>
    </Modal>
  );
}
