import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { Screen } from '@/components/ui';
import { useSession } from '@/providers/SessionProvider';
import { AuthScreen } from '@/screens/AuthScreen';
import { DashboardScreen } from '@/screens/DashboardScreen';
import { RideDetailScreen } from '@/screens/RideDetailScreen';
import { RideFormScreen } from '@/screens/RideFormScreen';
import { SplashScreen } from '@/screens/SplashScreen';
import { WeeklyReportScreen } from '@/screens/WeeklyReportScreen';
import { RootStackParamList } from '@/types/navigation';
import { Text, View } from 'react-native';

const Stack = createNativeStackNavigator<RootStackParamList>();

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#020617',
    card: '#020617',
    text: '#ffffff',
    border: '#1e293b',
    primary: '#2691ff',
  },
};

export function RootNavigator() {
  const { isLoading, session } = useSession();

  if (isLoading) {
    return (
      <NavigationContainer theme={navigationTheme}>
        <Screen scroll={false} avatarPlacement="none">
          <View className="flex-1 items-center justify-center">
            <Text className="text-lg font-semibold text-white">Connecting RouteFlow...</Text>
            <Text className="mt-2 text-sm text-slate-400">
              Loading your account and ride data.
            </Text>
          </View>
        </Screen>
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: '#020617',
          },
          headerTintColor: '#ffffff',
          headerShadowVisible: false,
          contentStyle: {
            backgroundColor: '#020617',
          },
        }}
      >
        {session ? (
          <>
            <Stack.Screen
              name="Dashboard"
              component={DashboardScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="RideDetail"
              component={RideDetailScreen}
              options={{
                headerShown: false,
                presentation: 'transparentModal',
                animation: 'slide_from_bottom',
                contentStyle: {
                  backgroundColor: 'transparent',
                },
              }}
            />
            <Stack.Screen
              name="RideForm"
              component={RideFormScreen}
              options={{
                headerShown: false,
                presentation: 'transparentModal',
                animation: 'slide_from_bottom',
                contentStyle: {
                  backgroundColor: 'transparent',
                },
              }}
            />
            <Stack.Screen
              name="WeeklyReport"
              component={WeeklyReportScreen}
              options={{
                headerShown: false,
                presentation: 'transparentModal',
                animation: 'slide_from_bottom',
                contentStyle: {
                  backgroundColor: 'transparent',
                },
              }}
            />
          </>
        ) : (
          <>
            <Stack.Screen
              name="Splash"
              component={SplashScreen}
              options={{ headerShown: false, animation: 'fade' }}
            />
            <Stack.Screen
              name="Auth"
              component={AuthScreen}
              options={{ headerShown: false, animation: 'slide_from_right' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
