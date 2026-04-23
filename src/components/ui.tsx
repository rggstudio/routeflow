import { ReactNode, useRef } from 'react';
import { Animated, KeyboardAvoidingView, Platform, Pressable, type StyleProp, Switch, Text, TextInput, type ViewStyle, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

import { UserAvatar } from '@/components/UserAvatar';

type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  avatarPlacement?: 'right' | 'center' | 'none';
  paddingTop?: number;
  keyboardAware?: boolean;
};

export function Screen({ children, scroll = true, avatarPlacement = 'right', paddingTop = 20, keyboardAware = false }: ScreenProps) {
  const scrollY = useRef(new Animated.Value(0)).current;
  const navigationFadeOpacity = scrollY.interpolate({
    inputRange: [0, 36],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const rightAvatar =
    avatarPlacement === 'right' ? (
      <View className="absolute right-0 top-0 z-10">
        <UserAvatar size="sm" />
      </View>
    ) : null;

  const scrollView = (
    <View className="flex-1">
      <Animated.ScrollView
        contentContainerStyle={{ padding: 20, paddingTop, paddingBottom: 140 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        scrollEventThrottle={16}
      >
        <View className="relative">
          {rightAvatar}
          {children}
        </View>
      </Animated.ScrollView>

      <Animated.View
        pointerEvents="none"
        style={{
          opacity: navigationFadeOpacity,
        }}
        className="absolute bottom-0 left-0 right-0 h-36"
      >
        <View className="absolute bottom-0 left-0 right-0 h-24 bg-slate-950" />
        <View className="absolute bottom-24 left-0 right-0 h-5 bg-slate-950/80" />
        <View className="absolute bottom-28 left-0 right-0 h-4 bg-slate-950/60" />
        <View className="absolute bottom-31 left-0 right-0 h-3 bg-slate-950/40" />
      </Animated.View>
    </View>
  );

  const content = scroll ? (
    keyboardAware ? (
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {scrollView}
      </KeyboardAvoidingView>
    ) : scrollView
  ) : (
    <View className="flex-1 px-5 pb-28 pt-5">
      <View className="relative flex-1">
        {rightAvatar}
        {children}
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-950" edges={['top', 'left', 'right']}>
      <View className="absolute inset-0 bg-slate-950" />
      {content}
    </SafeAreaView>
  );
}

type SectionCardProps = {
  title?: string;
  eyebrow?: string;
  children: ReactNode;
  className?: string;
};

export function SectionCard({ title, eyebrow, children, className }: SectionCardProps) {
  const classes = [
    'mb-4 overflow-hidden rounded-[28px] border border-white/10 bg-slate-900/80 px-5 py-5',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <View className={classes}>
      {eyebrow ? (
        <Text className="text-[11px] font-semibold uppercase tracking-[2px] text-cyan-300">
          {eyebrow}
        </Text>
      ) : null}
      {title ? <Text className="mt-2 text-xl font-semibold text-white">{title}</Text> : null}
      <View className={title || eyebrow ? 'mt-4' : ''}>{children}</View>
    </View>
  );
}

type StatTileProps = {
  label: string;
  value: string;
  tone?: 'default' | 'positive' | 'warning' | 'negative';
  style?: StyleProp<ViewStyle>;
  labelClassName?: string;
  valueClassName?: string;
  labelNumberOfLines?: number;
};

export function StatTile({
  label,
  value,
  tone = 'default',
  style,
  labelClassName,
  valueClassName,
  labelNumberOfLines = 1,
}: StatTileProps) {
  const background =
    tone === 'positive'
      ? 'bg-emerald-500/15'
      : tone === 'warning'
        ? 'bg-amber-500/15'
        : tone === 'negative'
          ? 'bg-rose-500/15'
          : 'bg-white/5';
  const textColor =
    tone === 'positive'
      ? 'text-emerald-200'
      : tone === 'warning'
        ? 'text-amber-100'
        : tone === 'negative'
          ? 'text-rose-300'
          : 'text-white';

  return (
    <View className={`min-w-[104px] flex-1 rounded-3xl px-4 py-4 ${background}`} style={style}>
      <Text
        className={`text-xs uppercase tracking-[1.5px] text-slate-400 ${labelClassName ?? ''}`}
        numberOfLines={labelNumberOfLines}
      >
        {label}
      </Text>
      <Text className={`mt-3 text-2xl font-semibold ${textColor} ${valueClassName ?? ''}`}>
        {value}
      </Text>
    </View>
  );
}

type ActionButtonProps = {
  label?: string;
  onPress: () => void;
  kind?: 'primary' | 'secondary' | 'ghost' | 'danger';
  icon?: keyof typeof Ionicons.glyphMap;
};

export function ActionButton({
  label,
  onPress,
  kind = 'secondary',
  icon,
}: ActionButtonProps) {
  const iconOnly = !!icon && !label;

  const classes = {
    primary: 'bg-cyan-400',
    secondary: 'bg-white/10',
    ghost: 'bg-transparent',
    danger: 'bg-rose-500/20',
  };
  const textClass = {
    primary: 'text-slate-950',
    secondary: 'text-white',
    ghost: 'text-slate-300',
    danger: 'text-rose-100',
  };
  const iconColor = {
    primary: '#0f172a',
    secondary: '#ffffff',
    ghost: '#cbd5e1',
    danger: '#ffe4e6',
  };

  return (
    <Pressable
      className={`rounded-full active:opacity-80 ${iconOnly ? 'px-4 py-4' : 'px-4 py-3'} ${classes[kind]}`}
      onPress={onPress}
    >
      <View className="flex-row items-center justify-center gap-1.5">
        {icon ? (
          <Ionicons name={icon} size={iconOnly ? 22 : 15} color={iconColor[kind]} />
        ) : null}
        {label ? (
          <Text className={`font-semibold ${textClass[kind]}`}>{label}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

type PillButtonProps = {
  label: string;
  selected?: boolean;
  onPress: () => void;
};

export function PillButton({ label, selected = false, onPress }: PillButtonProps) {
  return (
    <Pressable
      className={`rounded-full border px-4 py-2 active:opacity-80 ${
        selected
          ? 'border-cyan-300 bg-cyan-400/15'
          : 'border-white/10 bg-white/5'
      }`}
      onPress={onPress}
    >
      <Text className={`font-medium ${selected ? 'text-cyan-200' : 'text-slate-300'}`}>
        {label}
      </Text>
    </Pressable>
  );
}

type InputFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'phone-pad' | 'numeric';
  secureTextEntry?: boolean;
};

export function InputField({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  keyboardType = 'default',
  secureTextEntry = false,
}: InputFieldProps) {
  return (
    <View className="mb-4">
      <Text className="mb-2 text-sm font-medium text-slate-300">{label}</Text>
      <TextInput
        className={`rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-white ${
          multiline ? 'min-h-[104px]' : ''
        }`}
        multiline={multiline}
        keyboardType={keyboardType}
        placeholder={placeholder}
        placeholderTextColor="#64748b"
        value={value}
        onChangeText={onChangeText}
        textAlignVertical={multiline ? 'top' : 'center'}
        secureTextEntry={secureTextEntry}
      />
    </View>
  );
}

type SelectFieldProps = {
  label: string;
  value: string;
  onPress: () => void;
  placeholder?: string;
  icon?: keyof typeof Ionicons.glyphMap;
};

export function SelectField({
  label,
  value,
  onPress,
  placeholder,
  icon,
}: SelectFieldProps) {
  const displayValue = value || placeholder || '';

  return (
    <View className="mb-4">
      <Text className="mb-2 text-sm font-medium text-slate-300">{label}</Text>
      <Pressable
        className="flex-row items-center justify-between rounded-3xl border border-white/10 bg-white/5 px-4 py-3 active:opacity-80"
        onPress={onPress}
      >
        <View className="flex-1 flex-row items-center gap-2">
          {icon ? <Ionicons name={icon} size={16} color="#67e8f9" /> : null}
          <Text className={value ? 'flex-1 text-white' : 'flex-1 text-slate-500'}>{displayValue}</Text>
        </View>
        <Ionicons name="chevron-down" size={18} color="#94a3b8" />
      </Pressable>
    </View>
  );
}

type ToggleRowProps = {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
};

export function ToggleRow({ label, value, onValueChange }: ToggleRowProps) {
  return (
    <View className="flex-row items-center justify-between rounded-3xl border border-white/10 bg-white/5 px-4 py-3">
      <Text className="font-medium text-white">{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        thumbColor="#ecfeff"
        trackColor={{ true: '#0891b2', false: '#334155' }}
      />
    </View>
  );
}
