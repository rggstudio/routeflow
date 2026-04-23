import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { ActionButton, InputField } from '@/components/ui';

type CancelRideWithPayModalProps = {
  visible: boolean;
  riderName: string;
  defaultAmount: number;
  onClose: () => void;
  onSubmit: (payAmount: number) => void;
};

function formatAmountInput(amount: number) {
  return amount.toFixed(2);
}

function sanitizeAmountInput(value: string) {
  const sanitized = value.replace(/[^0-9.]/g, '');
  const decimalIndex = sanitized.indexOf('.');

  if (decimalIndex === -1) {
    return sanitized;
  }

  const wholePart = sanitized.slice(0, decimalIndex) || '0';
  const decimalPart = sanitized.slice(decimalIndex + 1).replace(/\./g, '').slice(0, 2);

  return `${wholePart}.${decimalPart}`;
}

function parseAmountInput(value: string) {
  if (!value.trim()) {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return Math.round(parsed * 100) / 100;
}

export function CancelRideWithPayModal({
  visible,
  riderName,
  defaultAmount,
  onClose,
  onSubmit,
}: CancelRideWithPayModalProps) {
  const [payAmountInput, setPayAmountInput] = useState(() => formatAmountInput(defaultAmount));
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!visible) {
      return;
    }

    setPayAmountInput(formatAmountInput(defaultAmount));
    setErrorMessage('');
  }, [defaultAmount, visible]);

  const handleChangeText = (value: string) => {
    setPayAmountInput(sanitizeAmountInput(value));

    if (errorMessage) {
      setErrorMessage('');
    }
  };

  const handleSubmit = () => {
    const payAmount = parseAmountInput(payAmountInput);

    if (payAmount === null) {
      setErrorMessage('Enter a valid amount that is zero or more.');
      return;
    }

    onSubmit(payAmount);
  };

  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <KeyboardAvoidingView
        className="flex-1 justify-end bg-black/45"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable className="flex-1" onPress={onClose} />

        <View className="rounded-t-[32px] border border-white/10 bg-slate-950 px-5 pb-6 pt-3">
          <View className="mb-4 flex-row items-center justify-center">
            <View className="h-1.5 w-14 rounded-full bg-white/20" />
            <Pressable
              className="absolute right-0 rounded-full bg-white/5 p-2 active:opacity-80"
              onPress={onClose}
            >
              <Ionicons name="close" size={18} color="#cbd5e1" />
            </Pressable>
          </View>

          <Text className="text-[11px] font-semibold uppercase tracking-[2px] text-cyan-300">
            Cancel ride with pay
          </Text>
          <Text className="mt-2 text-3xl font-semibold text-white">{riderName}</Text>
          <Text className="mt-3 text-sm leading-6 text-slate-300">
            Update the amount below, then save to cancel this ride and keep that pay on the books.
          </Text>

          <View className="mt-5">
            <InputField
              label="Pay amount"
              value={payAmountInput}
              onChangeText={handleChangeText}
              placeholder="0.00"
              keyboardType="decimal-pad"
            />
            <Text className="-mt-2 text-xs text-slate-400">Usual pay: ${defaultAmount.toFixed(2)}</Text>
            {errorMessage ? (
              <Text className="mt-3 text-sm text-rose-200">{errorMessage}</Text>
            ) : null}
          </View>

          <View className="mt-6 gap-3">
            <ActionButton label="Save & Cancel Ride" kind="danger" onPress={handleSubmit} />
            <ActionButton label="Keep Ride" kind="secondary" onPress={onClose} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
