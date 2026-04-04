import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';

import { useSession } from '@/providers/SessionProvider';
import { useRouteFlow } from '@/providers/RouteFlowProvider';

type UserAvatarProps = {
  size?: 'sm' | 'lg' | 'xl';
  imageUrl?: string;
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

export function UserAvatar({ size = 'sm', imageUrl }: UserAvatarProps) {
  const { state } = useRouteFlow();
  const { session } = useSession();
  const [hasImageError, setHasImageError] = useState(false);

  const fallbackName = session?.user?.email?.split('@')[0] ?? '';
  const displayName = state.profile.name.trim() || fallbackName || 'RouteFlow';
  const initials = getInitials(displayName);
  const avatarUrl = (imageUrl ?? state.profile.avatarUrl).trim();
  const shouldShowImage = !!avatarUrl && !hasImageError;
  const classes =
    size === 'xl'
      ? 'h-36 w-36 rounded-[44px] border-2 text-4xl'
      : size === 'lg'
        ? 'h-20 w-20 rounded-[28px] border-2 text-2xl'
        : 'h-12 w-12 rounded-2xl border text-sm';

  useEffect(() => {
    setHasImageError(false);
  }, [avatarUrl]);

  return (
    <View
      className={`items-center justify-center overflow-hidden border-cyan-300/30 bg-cyan-400/12 shadow-sm ${classes}`}
    >
      {shouldShowImage ? (
        <Image
          source={{ uri: avatarUrl }}
          style={StyleSheet.absoluteFillObject}
          contentFit="cover"
          onError={() => setHasImageError(true)}
        />
      ) : null}
      {!shouldShowImage ? (
        <Text className="font-bold tracking-[1px] text-cyan-100">{initials}</Text>
      ) : null}
    </View>
  );
}
