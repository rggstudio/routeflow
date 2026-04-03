import { Pressable, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { SocialAuthProvider } from '@/providers/SessionProvider';

type SocialAuthButtonProps = {
  provider: SocialAuthProvider;
  onPress: () => void;
  disabled?: boolean;
  isLoading?: boolean;
};

const socialProviders: Record<
  SocialAuthProvider,
  {
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    buttonClassName: string;
    textClassName: string;
    iconColor: string;
  }
> = {
  apple: {
    label: 'Continue with Apple',
    icon: 'logo-apple',
    buttonClassName: 'border-black bg-black',
    textClassName: 'text-white',
    iconColor: '#ffffff',
  },
  google: {
    label: 'Continue with Google',
    icon: 'logo-google',
    buttonClassName: 'border-white bg-white',
    textClassName: 'text-slate-950',
    iconColor: '#1f2937',
  },
};

export function SocialAuthButton({
  provider,
  onPress,
  disabled = false,
  isLoading = false,
}: SocialAuthButtonProps) {
  const config = socialProviders[provider];
  const providerName = config.label.replace('Continue with ', '');

  return (
    <Pressable
      className={`rounded-full border px-4 py-3 active:opacity-80 ${config.buttonClassName}`}
      disabled={disabled}
      onPress={onPress}
    >
      <View className="flex-row items-center justify-center">
        <View className="absolute left-0 h-6 w-6 items-center justify-center">
          <Ionicons name={config.icon} size={18} color={config.iconColor} />
        </View>
        <Text className={`text-center text-base font-semibold ${config.textClassName}`}>
          {isLoading ? `Connecting to ${providerName}...` : config.label}
        </Text>
      </View>
    </Pressable>
  );
}
