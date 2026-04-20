import './global.css';

import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { LogBox } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { RootNavigator } from '@/navigation/RootNavigator';
import { RouteFlowProvider } from '@/providers/RouteFlowProvider';
import { SessionProvider } from '@/providers/SessionProvider';
import { ToastProvider } from '@/providers/ToastProvider';

if (__DEV__) {
  // Supabase emits this once before it clears an invalid stored refresh token.
  LogBox.ignoreLogs(['Invalid Refresh Token: Refresh Token Not Found']);
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ToastProvider>
          <SessionProvider>
            <RouteFlowProvider>
              <StatusBar style="light" />
              <RootNavigator />
            </RouteFlowProvider>
          </SessionProvider>
        </ToastProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
