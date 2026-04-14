import { useEffect, useState } from 'react';
import { Alert, Linking, Platform, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Constants from 'expo-constants';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AuthFormCard } from '@/components/AuthFormCard';
import { DateTimePickerSheet } from '@/components/DateTimePickerSheet';
import { UserAvatar } from '@/components/UserAvatar';
import {
  ActionButton,
  InputField,
  PillButton,
  Screen,
  SelectField,
  SectionCard,
  ToggleRow,
} from '@/components/ui';
import {
  DEFAULT_FIRST_RIDE_SUMMARY_TIME,
  formatTime,
  getTimeDate,
  isMorningSummaryTime,
  todayIso,
  toTimeValue,
} from '@/lib/date';
import { requestNotificationPermissions } from '@/lib/notifications';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/providers/SessionProvider';
import { useToast } from '@/providers/ToastProvider';
import { useRouteFlow } from '@/providers/RouteFlowProvider';
import { RootStackParamList } from '@/types/navigation';
import { NavigationApp } from '@/types/ride';

const navApps: NavigationApp[] = ['waze', 'google_maps', 'apple_maps'];
const appVersion = (Constants.expoConfig?.version ?? '1.0.0') as string;
const avatarBuckets = ['diver_avatar', 'driver_avatar'] as const;
const MORNING_SUMMARY_MIN_TIME = '00:00';
const MORNING_SUMMARY_MAX_TIME = '11:00';
const MORNING_SUMMARY_TIME_CONFIG = {
  minuteInterval: 1,
  minimumTime: MORNING_SUMMARY_MIN_TIME,
  maximumTime: MORNING_SUMMARY_MAX_TIME,
} as const;

function getErrorMessage(error: unknown, fallback = 'Try again.') {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as { message: unknown }).message);
  }

  return fallback;
}

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

function getAvatarExtension(asset: ImagePicker.ImagePickerAsset) {
  const fileName = asset.fileName ?? asset.uri.split('/').pop() ?? '';
  const extension = fileName.split('.').pop()?.toLowerCase();

  if (extension === 'png' || extension === 'webp' || extension === 'heic') {
    return extension;
  }

  return 'jpg';
}

function getAvatarContentType(asset: ImagePicker.ImagePickerAsset, extension: string) {
  if (asset.mimeType) {
    return asset.mimeType;
  }

  if (extension === 'png') {
    return 'image/png';
  }

  if (extension === 'webp') {
    return 'image/webp';
  }

  if (extension === 'heic') {
    return 'image/heic';
  }

  return 'image/jpeg';
}

function getMorningSummaryTimeValue(time: string) {
  const safeTime = isMorningSummaryTime(time) ? time : DEFAULT_FIRST_RIDE_SUMMARY_TIME;
  return getTimeDate(todayIso(), safeTime);
}

export function AccountScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { state, updateProfile, updatePreferences } = useRouteFlow();
  const { isConfigured, session, signOut } = useSession();
  const { showToast } = useToast();
  const [profileDraft, setProfileDraft] = useState(state.profile);
  const [preferencesDraft, setPreferencesDraft] = useState(state.preferences);
  const [pendingAvatarAsset, setPendingAvatarAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);
  const [isMorningSummaryPickerVisible, setIsMorningSummaryPickerVisible] = useState(false);

  useEffect(() => {
    setProfileDraft(state.profile);
    setPendingAvatarAsset(null);
  }, [state.profile]);

  useEffect(() => {
    setPreferencesDraft(state.preferences);
  }, [state.preferences]);

  const avatarPreviewUrl = pendingAvatarAsset?.uri ?? profileDraft.avatarUrl;

  const handlePickAvatar = async () => {
    try {
      if (Platform.OS !== 'web') {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permission.granted) {
          Alert.alert(
            'Gallery access needed',
            'Allow photo library access to choose a driver avatar.'
          );
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (result.canceled || !result.assets?.[0]) {
        return;
      }

      const asset = result.assets[0];
      setPendingAvatarAsset(asset);
      setProfileDraft((current) => ({
        ...current,
        avatarUrl: asset.uri,
      }));
    } catch (error) {
      Alert.alert(
        'Avatar selection failed',
        error instanceof Error ? error.message : 'Try choosing the photo again.'
      );
    }
  };

  const handleRemoveAvatar = () => {
    setPendingAvatarAsset(null);
    setProfileDraft((current) => ({
      ...current,
      avatarUrl: '',
    }));
  };

  const uploadAvatar = async (asset: ImagePicker.ImagePickerAsset) => {
    if (!supabase || !session) {
      throw new Error('Sign in to upload a driver avatar.');
    }

    const extension = getAvatarExtension(asset);
    const objectPath = `${session.user.id}/${Date.now()}.${extension}`;
    const contentType = getAvatarContentType(asset, extension);
    const uploadBody =
      Platform.OS === 'web' && asset.file
        ? asset.file
        : await fetch(asset.uri).then((response) => response.arrayBuffer());

    let lastError: Error | null = null;

    for (const bucket of avatarBuckets) {
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(objectPath, uploadBody, {
          contentType,
          upsert: true,
        });

      if (uploadError) {
        lastError = uploadError;
        continue;
      }

      const { data } = supabase.storage.from(bucket).getPublicUrl(objectPath);

      if (!data.publicUrl) {
        throw new Error('Supabase did not return an avatar URL.');
      }

      return data.publicUrl;
    }

    throw lastError ?? new Error('Avatar upload failed.');
  };

  const handleSaveProfile = async () => {
    try {
      setIsSavingProfile(true);
      const nextProfile = {
        ...profileDraft,
        avatarUrl: profileDraft.avatarUrl.trim(),
      };

      if (pendingAvatarAsset) {
        nextProfile.avatarUrl = await uploadAvatar(pendingAvatarAsset);
      }

      await updateProfile(nextProfile);
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

      if (
        preferencesDraft.firstRideSummaryEnabled &&
        !isMorningSummaryTime(preferencesDraft.firstRideSummaryTime)
      ) {
        Alert.alert(
          'Choose a morning time',
          'Set the morning summary between 12:00 AM and 11:00 AM.'
        );
        return;
      }

      if (
        Platform.OS !== 'web' &&
        preferencesDraft.notificationsEnabled &&
        preferencesDraft.firstRideSummaryEnabled
      ) {
        const permission = await requestNotificationPermissions();

        if (!permission.granted) {
          Alert.alert(
            'Notifications are off',
            'Allow notifications for RouteFlow so the first ride summary can show up on your device.'
          );
          return;
        }
      }

      const result = await updatePreferences(preferencesDraft);
      showToast({ title: 'Preferences saved', message: 'RouteFlow updated your default settings.' });

      if (result.warning) {
        Alert.alert('Preferences saved with a warning', result.warning);
      }
    } catch (error) {
      Alert.alert('Preferences save failed', getErrorMessage(error));
    } finally {
      setIsSavingPreferences(false);
    }
  };

  const handleMorningSummaryTimeConfirm = (value: Date) => {
    const nextTime = toTimeValue(value);

    if (!isMorningSummaryTime(nextTime)) {
      Alert.alert(
        'Choose a morning time',
        'Set the morning summary between 12:00 AM and 11:00 AM.'
      );
      return;
    }

    setPreferencesDraft((current) => ({
      ...current,
      firstRideSummaryTime: nextTime,
    }));
    setIsMorningSummaryPickerVisible(false);
  };

  return (
    <Screen avatarPlacement="none">
      <View className="mb-6">
        <Text className="text-[11px] font-semibold uppercase tracking-[2px] text-cyan-300">
          Driver account
        </Text>
      </View>

      <View className="mb-8 items-center">
        <UserAvatar size="xl" imageUrl={avatarPreviewUrl} />
        <Text className="mt-4 text-2xl font-semibold text-white">
          {profileDraft.name || session?.user.email?.split('@')[0] || 'RouteFlow'}
        </Text>
        <Text className="mt-2 text-sm text-slate-400">
          {profileDraft.phone || session?.user.email || 'Driver profile'}
        </Text>
        {session ? (
          <View className="mt-5 w-full max-w-[260px] gap-3">
            <ActionButton
              label={avatarPreviewUrl ? 'Change photo' : 'Upload photo'}
              onPress={handlePickAvatar}
            />
            {avatarPreviewUrl ? (
              <ActionButton label="Remove photo" kind="ghost" onPress={handleRemoveAvatar} />
            ) : null}
          </View>
        ) : null}
      </View>

      {session ? (
        <>
          {state.profile.isAdmin ? (
            <SectionCard title="Owner tools" eyebrow="Private">
              <Text className="mb-4 text-sm leading-6 text-slate-300">
                Open the private owner dashboard to see driver-level usage, ride totals, and weekly activity.
              </Text>
              <ActionButton
                label="Open admin dashboard"
                kind="primary"
                onPress={() => navigation.navigate('AdminDashboard')}
              />
            </SectionCard>
          ) : null}

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
            {preferencesDraft.notificationsEnabled ? (
              <View className="mt-4 gap-4 rounded-[28px] border border-white/10 bg-white/5 px-4 py-4">
                <View>
                  <Text className="text-sm font-semibold text-white">Morning summary</Text>
                  <Text className="mt-1 text-sm leading-6 text-slate-400">
                    Send one summary at a set morning time to view your ride schedule.
                  </Text>
                </View>
                <ToggleRow
                  label="Morning summary"
                  value={preferencesDraft.firstRideSummaryEnabled}
                  onValueChange={(value) =>
                    setPreferencesDraft((current) => ({
                      ...current,
                      firstRideSummaryEnabled: value,
                    }))
                  }
                />
                {preferencesDraft.firstRideSummaryEnabled ? (
                  <View>
                    <SelectField
                      label="Send time"
                      value={formatTime(preferencesDraft.firstRideSummaryTime)}
                      icon="time-outline"
                      onPress={() => setIsMorningSummaryPickerVisible(true)}
                    />
                    <Text className="text-sm leading-6 text-slate-400">
                      Choose any time from 12:00 AM through 11:00 AM.
                    </Text>
                  </View>
                ) : null}
              </View>
            ) : null}
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
            onPress={() => Linking.openURL('https://route-flow-app.vercel.app/')}
          />
          <ActionButton
            label="Privacy Policy"
            onPress={() => Linking.openURL('https://route-flow-app.vercel.app/privacy')}
          />
        </View>
      </SectionCard>

      <SectionCard>
        <Text className="text-sm leading-6 text-slate-300">
          {isConfigured
            ? session
              ? `Signed in as ${session.user.email ?? 'driver account'}.`
              : 'Supabase is configured. Sign in to sync rides, profile, preferences, and your avatar.'
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

      <DateTimePickerSheet
        visible={isMorningSummaryPickerVisible}
        mode="time"
        title="Select morning summary time"
        value={getMorningSummaryTimeValue(preferencesDraft.firstRideSummaryTime)}
        timeConfig={MORNING_SUMMARY_TIME_CONFIG}
        onCancel={() => setIsMorningSummaryPickerVisible(false)}
        onConfirm={handleMorningSummaryTimeConfirm}
      />
    </Screen>
  );
}
