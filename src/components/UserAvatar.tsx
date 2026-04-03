import { Text, View } from 'react-native';

import { useSession } from '@/providers/SessionProvider';
import { useRouteFlow } from '@/providers/RouteFlowProvider';

type UserAvatarProps = {
  size?: 'sm' | 'lg' | 'xl';
};

function getInitials(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return 'RF';
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function UserAvatar({ size = 'sm' }: UserAvatarProps) {
  const { state } = useRouteFlow();
  const { session } = useSession();

  const fallbackName = session?.user?.email?.split('@')[0] ?? '';
  const displayName = state.profile.name.trim() || fallbackName || 'RouteFlow';
  const initials = getInitials(displayName);
  const classes =
    size === 'xl'
      ? 'h-36 w-36 rounded-[44px] border-2 text-4xl'
      : size === 'lg'
        ? 'h-20 w-20 rounded-[28px] border-2 text-2xl'
        : 'h-12 w-12 rounded-2xl border text-sm';

  return (
    <View
      className={`items-center justify-center border-cyan-300/30 bg-cyan-400/12 shadow-sm ${classes}`}
    >
      <Text className="font-bold tracking-[1px] text-cyan-100">{initials}</Text>
    </View>
  );
}
