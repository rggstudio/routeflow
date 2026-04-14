import { useMemo, useState } from 'react';
import { Alert, Keyboard, Platform, ScrollView, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AddressAutocomplete } from '@/components/AddressAutocomplete';
import { BottomSheetScreen } from '@/components/BottomSheetScreen';
// React Native resolves this to `.native` or `.web` at runtime.
import { DateTimePickerSheet } from '@/components/DateTimePickerSheet';
import { ActionButton, InputField, PillButton, SectionCard, SelectField } from '@/components/ui';
import { formatTime, fromIsoDate, getLongDateLabel, todayIso, toIsoDate, weekdayIndexToLabel } from '@/lib/date';
import { buildRecurrenceSummary, getDefaultRecurrenceDays, normalizeRecurrenceDays } from '@/lib/recurrence';
import { useRouteFlow } from '@/providers/RouteFlowProvider';
import { useToast } from '@/providers/ToastProvider';
import { RootStackParamList } from '@/types/navigation';
import { MonthlyRecurrenceMode, RideDraft, TripType } from '@/types/ride';

function makeSessionToken() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.floor(Math.random() * 16);
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

type Props = NativeStackScreenProps<RootStackParamList, 'RideForm'>;

type RecurrenceSelection = 'none' | 'weekly' | 'biweekly' | 'monthly';

const recurrenceModes: { value: RecurrenceSelection; label: string }[] = [
  { value: 'none', label: 'One-time' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Every 2 weeks' },
  { value: 'monthly', label: 'Monthly' },
];

const monthlyModes: { value: MonthlyRecurrenceMode; label: string }[] = [
  { value: 'day_of_month', label: 'Same date' },
  { value: 'nth_weekday', label: 'Same weekday pattern' },
];

const tripTypes: { value: TripType; label: string }[] = [
  { value: 'single', label: 'Single trip' },
  { value: 'round_trip', label: 'Round trip' },
];

type PickerField = 'serviceDate' | 'pickupTime' | 'returnPickupTime';
type PickerMode = 'date' | 'time';

type ActivePicker = {
  field: PickerField;
  mode: PickerMode;
  title: string;
  value: Date;
} | null;

function toTimeValue(date: Date) {
  const hours = `${date.getHours()}`.padStart(2, '0');
  const minutes = `${date.getMinutes()}`.padStart(2, '0');
  return `${hours}:${minutes}`;
}

function getTimeDate(baseDateIso: string, time: string) {
  const [hours, minutes] = time.split(':').map(Number);
  const date = fromIsoDate(baseDateIso);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

export function RideFormScreen({ navigation, route }: Props) {
  const { addRide, createDraftForGroup, updateRide } = useRouteFlow();
  const { showToast } = useToast();
  const isEditing = Boolean(route.params?.groupId);
  const [activePicker, setActivePicker] = useState<ActivePicker>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const sessionToken = useMemo(() => makeSessionToken(), []);
  const [draft, setDraft] = useState<RideDraft>(
    createDraftForGroup(route.params?.groupId) ?? {
      riderName: '',
      phone: '',
      tripType: 'single',
      pickupAddress: '',
      dropoffAddress: '',
      pickupTime: '08:00',
      returnPickupTime: '15:00',
      returnDropoffAddress: '',
      payAmount: '',
      recurrenceType: 'none',
      recurrenceInterval: 1,
      recurrenceDays: [],
      recurrenceMonthlyMode: null,
      serviceDate: todayIso(),
      notes: '',
    }
  );

  const setField = <K extends keyof RideDraft>(key: K, value: RideDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const recurrenceSelection: RecurrenceSelection =
    draft.recurrenceType === 'none'
      ? 'none'
      : draft.recurrenceType === 'monthly'
        ? 'monthly'
        : draft.recurrenceInterval === 2
          ? 'biweekly'
          : 'weekly';

  const applyRecurrenceSelection = (selection: RecurrenceSelection) => {
    if (selection === 'none') {
      setDraft((current) => ({
        ...current,
        recurrenceType: 'none',
        recurrenceInterval: 1,
        recurrenceDays: [],
        recurrenceMonthlyMode: null,
      }));
      return;
    }

    if (selection === 'monthly') {
      setDraft((current) => ({
        ...current,
        recurrenceType: 'monthly',
        recurrenceInterval: 1,
        recurrenceDays: [],
        recurrenceMonthlyMode: current.recurrenceMonthlyMode ?? 'day_of_month',
      }));
      return;
    }

    setDraft((current) => ({
      ...current,
      recurrenceType: 'weekly',
      recurrenceInterval: selection === 'biweekly' ? 2 : 1,
      recurrenceDays:
        normalizeRecurrenceDays(current.recurrenceDays).length > 0
          ? normalizeRecurrenceDays(current.recurrenceDays)
          : getDefaultRecurrenceDays(current.serviceDate),
      recurrenceMonthlyMode: null,
    }));
  };

  const toggleRecurrenceDay = (day: number) => {
    const selected = draft.recurrenceDays.includes(day);
    const nextDays = selected
      ? draft.recurrenceDays.filter((value) => value !== day)
      : [...draft.recurrenceDays, day];

    setField('recurrenceDays', normalizeRecurrenceDays(nextDays));
  };

  const recurrenceSummary =
    recurrenceSelection === 'none'
      ? ''
      : buildRecurrenceSummary({
          recurrenceType: draft.recurrenceType,
          recurrenceInterval: draft.recurrenceInterval,
          recurrenceDays: draft.recurrenceDays,
          recurrenceMonthlyMode: draft.recurrenceMonthlyMode,
          recurrenceAnchorDate: draft.serviceDate,
        });

  const getPickerConfig = (field: PickerField) => {
    switch (field) {
      case 'serviceDate':
        return {
          field,
          mode: 'date' as const,
          title: 'Select service date',
          value: fromIsoDate(draft.serviceDate),
        };
      case 'pickupTime':
        return {
          field,
          mode: 'time' as const,
          title: 'Select pickup time',
          value: getTimeDate(draft.serviceDate, draft.pickupTime),
        };
      case 'returnPickupTime':
        return {
          field,
          mode: 'time' as const,
          title: 'Select return pickup time',
          value: getTimeDate(draft.serviceDate, draft.returnPickupTime),
        };
      default:
        return null;
    }
  };

  const applyPickerValue = (field: PickerField, value: Date) => {
    if (field === 'serviceDate') {
      setField('serviceDate', toIsoDate(value));
      return;
    }

    if (field === 'pickupTime') {
      setField('pickupTime', toTimeValue(value));
      return;
    }

    setField('returnPickupTime', toTimeValue(value));
  };

  const openPicker = (field: PickerField) => {
    const config = getPickerConfig(field);

    if (!config) {
      return;
    }

    setActivePicker(config);
  };

  const closePicker = () => {
    setActivePicker(null);
  };

  const submit = async () => {
    try {
      setIsSubmitting(true);
      if (isEditing && route.params?.groupId) {
        await updateRide(route.params.groupId, draft);
        showToast({
          title: 'Ride updated',
          message: `${draft.riderName.trim() || 'Rider'} was saved successfully.`,
        });
      } else {
        await addRide(draft);
        showToast({
          title: 'Ride added',
          message: `${draft.riderName.trim() || 'Rider'} is now on your schedule.`,
        });
      }

      if (isEditing) {
        navigation.pop(2);
      } else {
        navigation.goBack();
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : typeof error === 'object' && error !== null && 'message' in error
            ? String((error as { message: unknown }).message)
            : 'Something went wrong. Please try again.';
      const isValidationError =
        error instanceof Error &&
        (message.includes('required') || message.includes('Choose'));
      Alert.alert(isValidationError ? 'Missing details' : 'Could not save ride', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BottomSheetScreen onClose={() => navigation.goBack()}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        onScrollBeginDrag={Keyboard.dismiss}
      >
        <View className="mb-6">
          <Text className="text-[11px] font-semibold uppercase tracking-[2px] text-cyan-300">
            {isEditing ? 'Edit ride' : 'Add ride'}
          </Text>
          <Text className="mt-2 text-4xl font-semibold text-white">
            {isEditing ? 'Update this route' : 'Build a ride fast'}
          </Text>
          <Text className="mt-3 text-base leading-7 text-slate-300">
            Keep typing light. One form creates one-time or recurring trips automatically.
          </Text>
        </View>

        <SectionCard title="Rider">
          <InputField
            label="Name"
            value={draft.riderName}
            onChangeText={(value) => setField('riderName', value)}
          />
          <InputField
            label="Phone"
            value={draft.phone}
            keyboardType="phone-pad"
            onChangeText={(value) => setField('phone', value)}
            placeholder="Optional"
          />
        </SectionCard>

        <SectionCard title="Trip type">
          <View className="flex-row flex-wrap gap-2">
            {tripTypes.map((type) => (
              <PillButton
                key={type.value}
                label={type.label}
                selected={draft.tripType === type.value}
                onPress={() => setField('tripType', type.value)}
              />
            ))}
          </View>
        </SectionCard>

        <SectionCard title="Recurrence">
          <View className="mb-4 flex-row flex-wrap gap-2">
            {recurrenceModes.map((mode) => (
              <PillButton
                key={mode.value}
                label={mode.label}
                selected={recurrenceSelection === mode.value}
                onPress={() => applyRecurrenceSelection(mode.value)}
              />
            ))}
          </View>

          {recurrenceSelection === 'weekly' ? (
            <View className="mb-4">
              <Text className="mb-2 text-sm font-medium text-slate-300">Shortcut</Text>
              <View className="flex-row flex-wrap gap-2">
                <PillButton
                  label="Weekdays"
                  selected={normalizeRecurrenceDays(draft.recurrenceDays).join(',') === '1,2,3,4,5'}
                  onPress={() => setField('recurrenceDays', [1, 2, 3, 4, 5])}
                />
              </View>
            </View>
          ) : null}

          {recurrenceSelection === 'weekly' || recurrenceSelection === 'biweekly' ? (
            <View className="mb-4">
              <Text className="mb-2 text-sm font-medium text-slate-300">Repeat on</Text>
              <View className="flex-row flex-wrap gap-2">
                {Array.from({ length: 7 }, (_, index) => index + 1).map((day) => (
                  <PillButton
                    key={day}
                    label={weekdayIndexToLabel(day)}
                    selected={draft.recurrenceDays.includes(day)}
                    onPress={() => toggleRecurrenceDay(day)}
                  />
                ))}
              </View>
            </View>
          ) : null}

          {recurrenceSelection === 'monthly' ? (
            <View className="mb-4">
              <Text className="mb-2 text-sm font-medium text-slate-300">Monthly pattern</Text>
              <View className="flex-row flex-wrap gap-2">
                {monthlyModes.map((mode) => (
                  <PillButton
                    key={mode.value}
                    label={mode.label}
                    selected={draft.recurrenceMonthlyMode === mode.value}
                    onPress={() => setField('recurrenceMonthlyMode', mode.value)}
                  />
                ))}
              </View>
            </View>
          ) : null}

          {recurrenceSummary ? (
            <Text className="text-sm leading-6 text-slate-300">
              {recurrenceSummary} Service date sets the anchor.
            </Text>
          ) : null}
        </SectionCard>

        <SectionCard title="Trip details">
          <SelectField
            label="Service date"
            value={getLongDateLabel(draft.serviceDate)}
            icon="calendar-outline"
            onPress={() => openPicker('serviceDate')}
          />
          <AddressAutocomplete
            label="Pickup address"
            value={draft.pickupAddress}
            onChangeText={(value) => setField('pickupAddress', value)}
            sessionToken={sessionToken}
          />
          <AddressAutocomplete
            label="Dropoff address"
            value={draft.dropoffAddress}
            onChangeText={(value) => setField('dropoffAddress', value)}
            sessionToken={sessionToken}
          />
          <SelectField
            label="Pickup time"
            value={formatTime(draft.pickupTime)}
            icon="time-outline"
            onPress={() => openPicker('pickupTime')}
          />

          {draft.tripType === 'round_trip' ? (
            <>
              <SelectField
                label="Return pickup time"
                value={formatTime(draft.returnPickupTime)}
                icon="time-outline"
                onPress={() => openPicker('returnPickupTime')}
              />
              <AddressAutocomplete
                label="Return dropoff address"
                value={draft.returnDropoffAddress}
                onChangeText={(value) => setField('returnDropoffAddress', value)}
                placeholder="Defaults to original pickup"
                sessionToken={sessionToken}
              />
            </>
          ) : null}
        </SectionCard>

        <SectionCard title="Payment">
          <InputField
            label="Amount"
            value={draft.payAmount}
            keyboardType="numeric"
            onChangeText={(value) => setField('payAmount', value)}
            placeholder="0.00"
          />
        </SectionCard>

        <SectionCard title="Notes">
          <InputField
            label="Notes"
            multiline
            value={draft.notes}
            onChangeText={(value) => setField('notes', value)}
            placeholder="Gate code, parent preference, dispatcher context..."
          />
        </SectionCard>

        <View className="gap-3">
          <ActionButton
            label={isSubmitting ? 'Saving...' : isEditing ? 'Save changes' : 'Create ride'}
            kind="primary"
            onPress={submit}
          />
          <ActionButton label="Cancel" onPress={() => navigation.goBack()} />
        </View>
      </ScrollView>

      <DateTimePickerSheet
        visible={activePicker !== null}
        mode={activePicker?.mode ?? 'date'}
        title={activePicker?.title ?? ''}
        value={activePicker?.value ?? fromIsoDate(draft.serviceDate)}
        onCancel={closePicker}
        onConfirm={(value) => {
          if (!activePicker) {
            return;
          }

          applyPickerValue(activePicker.field, value);
          closePicker();
        }}
      />
    </BottomSheetScreen>
  );
}
