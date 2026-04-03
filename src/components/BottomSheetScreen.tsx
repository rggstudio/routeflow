import { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

type BottomSheetScreenProps = {
  children: ReactNode;
  onClose: () => void;
};

export function BottomSheetScreen({ children, onClose }: BottomSheetScreenProps) {
  return (
    <View className="flex-1 justify-end bg-black/45">
      <Pressable className="flex-1" onPress={onClose} />

      <View className="max-h-[92%] rounded-t-[32px] border border-white/10 bg-slate-950 px-5 pt-3">
        <View className="mb-4 flex-row items-center justify-center">
          <View className="h-1.5 w-14 rounded-full bg-white/20" />
          <Pressable
            className="absolute right-0 rounded-full bg-white/5 p-2 active:opacity-80"
            onPress={onClose}
          >
            <Ionicons name="close" size={18} color="#cbd5e1" />
          </Pressable>
        </View>

        {children}
      </View>
    </View>
  );
}
