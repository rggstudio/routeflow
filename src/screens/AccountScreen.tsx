import { Alert, Linking, Text, View } from 'react-native';
import { useEffect, useState } from 'react';

import { AuthFormCard } from '@/components/AuthFormCard';
import { UserAvatar } from '@/components/UserAvatar';
import {
  ActionButton,
  InputField,
  PillButton,
  Screen,
  SectionCard,
  ToggleRow,
} from '@/components/ui';
import { useSession } from '@/providers/SessionProvider';
import { useToast } from '@/providers/ToastProvider';
import { useRouteFlow } from '@/providers/RouteFlowProvider';
import { NavigationApp } from '@/types/ride';

const navApps: NavigationApp[] = ['waze', 'google_maps', 'apple_maps'];
const appVersion = require('../../app.json').expo.version as string;

function navLabel(app: NavigationApp) {
  switch (app) {
    case 'waze':
      return 'Waze';
    case 'google_maps':
      return 'Google Maps';
    case 'apple_maps':
      return 'Apple Maps';
    default:
      return app;
  }
}

export function AccountScreen() {
  const { state, updateProfile, updatePreferences } = useRouteFlow();
  const { isConfigured, session, signOut } = useSession();
  const { showToast } = useToast();
  const [profileDraft, setProfileDraft] = useState(state.profile);
  const [preferencesDraft, setPreferencesDraft] = useState(state.preferences);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);

  useEffect(() => {
    setProfileDraft(state.profile);
  }, [state.profile]);

  useEffect(() => {
    setPreferencesDraft(state.preferences);
  }, [state.preferences]);

  const handleSaveProfile = async () => {
    try {
      setIsSavingProfile(true);
      await updateProfile(profileDraft);
      showToast({ title: 'Profile saved', message: 'Your account details are up to date.' });
    } catch (error) {
      Alert.alert('Profile save failed', error instanceof Error ? error.message : 'Try again.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSavePreferences = async () => {
    try {
      setIsSavingPreferences(true);
      await updatePreferences(preferencesDraft);
      showToast({ title: 'Preferences saved', message: 'RouteFlow updated your default settings.' });
    } catch (error) {
      Alert.alert(
        'Preferences save failed',
        error instanceof Error ? error.message : 'Try again.'
      );
    } finally {
      setIsSavingPreferences(false);
    }
  };

  return (
    <Screen avatarPlacement="none">
      <View className="mb-6">
        <Text className="text-[11px] font-semibold uppercase tracking-[2px] text-cyan-300">
          Driver account
        </Text>
      </View>

      <View className="mb-8 items-center">
        <UserAvatar size="xl" />
        <Text className="mt-4 text-2xl font-semibold text-white">
          {state.profile.name || session?.user.email?.split('@')[0] || 'RouteFlow'}
        </Text>
        <Text className="mt-2 text-sm text-slate-400">
          {state.profile.phone || session?.user.email || 'Driver profile'}
        </Text>
      </View>

      {session ? (
        <>
          <SectionCard title="Profile">
            <InputField
              label="Name"
              value={profileDraft.name}
              onChangeText={(value) => setProfileDraft((current) => ({ ...current, name: value }))}
            />
            <InputField
              label="Phone"
              keyboardType="phone-pad"
              value={profileDraft.phone}
              onChangeText={(value) => setProfileDraft((current) => ({ ...current, phone: value }))}
            />
            <ActionButton
              label={isSavingProfile ? 'Saving...' : 'Save profile'}
              kind="primary"
              onPress={handleSaveProfile}
            />
          </SectionCard>

          <SectionCard title="Preferences">
            <Text className="mb-2 text-sm font-medium text-slate-300">Default navigation app</Text>
            <View className="mb-4 flex-row flex-wrap gap-2">
              {navApps.map((app) => (
                <PillButton
                  key={app}
                  label={navLabel(app)}
                  selected={preferencesDraft.defaultNavigationApp === app}
                  onPress={() =>
                    setPreferencesDraft((current) => ({
                      ...current,
                      defaultNavigationApp: app,
                    }))
                  }
                />
              ))}
            </View>
            <ToggleRow
              label="Notifications"
              value={preferencesDraft.notificationsEnabled}
              onValueChange={(value) =>
                setPreferencesDraft((current) => ({
                  ...current,
                  notificationsEnabled: value,
                }))
              }
            />
            <View className="mt-4">
              <ActionButton
                label={isSavingPreferences ? 'Saving...' : 'Save preferences'}
                kind="primary"
                onPress={handleSavePreferences}
              />
            </View>
          </SectionCard>
        </>
      ) : (
        <AuthFormCard />
      )}

      <SectionCard title="Support">
        <View className="gap-3">
          <ActionButton
            label="Help Center"
            onPress={() => Alert.alert('Help Center', 'Support content can be linked here next.')}
          />
          <ActionButton
            label="Privacy Policy"
            onPress={() => Linking.openURL('https://example.com/privacy')}
          />
        </View>
      </SectionCard>

      <SectionCard>
        <Text className="text-sm leading-6 text-slate-300">
          {isConfigured
            ? session
              ? `Signed in as ${session.user.email ?? 'driver account'}.`
              : 'Supabase is configured. Sign in to sync rides, profile, and preferences.'
            : 'Supabase is not configured yet.'}
        </Text>
        {session ? (
          <View className="mt-4">
            <ActionButton label="Logout" kind="danger" onPress={signOut} />
          </View>
        ) : null}
      </SectionCard>

      <View className="pb-6 pt-2">
        <Text className="text-center text-xs font-medium uppercase tracking-[1.8px] text-slate-500">
          Version {appVersion}
        </Text>
      </View>
    </Screen>
  );
}
