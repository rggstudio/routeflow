import { Pressable, Text, View } from 'react-native';

type StatusTone = 'ready' | 'setup' | 'future';

type StatusCardProps = {
  title: string;
  description: string;
  tone?: StatusTone;
  actionLabel?: string;
  onPress?: () => void;
};

const toneStyles: Record<StatusTone, string> = {
  ready: 'border-emerald-500/30 bg-emerald-500/10',
  setup: 'border-amber-500/30 bg-amber-500/10',
  future: 'border-slate-700 bg-slate-900',
};

const toneBadges: Record<StatusTone, string> = {
  ready: 'Ready',
  setup: 'Setup',
  future: 'Future',
};

export function StatusCard({
  title,
  description,
  tone = 'future',
  actionLabel,
  onPress,
}: StatusCardProps) {
  return (
    <View className={`mb-4 rounded-3xl border p-5 ${toneStyles[tone]}`}>
      <View className="mb-3 flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="text-lg font-semibold text-white">{title}</Text>
          <Text className="mt-2 text-sm leading-6 text-slate-300">{description}</Text>
        </View>

        <View className="rounded-full bg-slate-950/50 px-3 py-1">
          <Text className="text-xs font-medium uppercase tracking-wide text-slate-300">
            {toneBadges[tone]}
          </Text>
        </View>
      </View>

      {actionLabel && onPress ? (
        <Pressable
          className="self-start rounded-full bg-brand-500 px-4 py-2 active:opacity-80"
          onPress={onPress}
        >
          <Text className="font-semibold text-white">{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
