import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

import { combineDateAndTime, formatTime, getLongDateLabel } from '@/lib/date';
import { DriverPreferences, RideOccurrenceView } from '@/types/ride';

const FIRST_RIDE_SUMMARY_TYPE = 'first_ride_summary';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function isSupportedPlatform() {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

function isSchedulableRide(ride: RideOccurrenceView) {
  return ride.occurrence.status !== 'completed' && ride.occurrence.status !== 'canceled' && ride.occurrence.status !== 'canceled_paid';
}

function getFirstRideSummaryCandidate(
  rides: RideOccurrenceView[],
  leadTimeMinutes: number,
  now: Date
) {
  const ridesByDate = new Map<string, RideOccurrenceView[]>();

  for (const ride of rides) {
    if (!isSchedulableRide(ride)) {
      continue;
    }

    const current = ridesByDate.get(ride.occurrence.serviceDate) ?? [];
    current.push(ride);
    ridesByDate.set(ride.occurrence.serviceDate, current);
  }

  const orderedDates = [...ridesByDate.keys()].sort((a, b) => a.localeCompare(b));

  for (const serviceDate of orderedDates) {
    const dayRides = (ridesByDate.get(serviceDate) ?? []).sort((a, b) =>
      a.activeLeg.pickupTime.localeCompare(b.activeLeg.pickupTime)
    );
    const firstRide = dayRides[0];

    if (!firstRide) {
      continue;
    }

    const firstRideAt = combineDateAndTime(serviceDate, firstRide.activeLeg.pickupTime);
    const triggerAt = new Date(firstRideAt.getTime() - leadTimeMinutes * 60 * 1000);

    if (triggerAt <= now) {
      continue;
    }

    return {
      triggerAt,
      firstRide,
      totalRides: dayRides.length,
    };
  }

  return null;
}

export async function requestNotificationPermissions() {
  if (!isSupportedPlatform()) {
    return { granted: false, canAskAgain: false };
  }

  const existing = await Notifications.getPermissionsAsync();

  if (existing.granted || existing.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
    return { granted: true, canAskAgain: existing.canAskAgain };
  }

  const next = await Notifications.requestPermissionsAsync();
  const granted =
    next.granted || next.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;

  return {
    granted,
    canAskAgain: next.canAskAgain,
  };
}

export async function configureNotificationChannel() {
  if (Platform.OS !== 'android') {
    return;
  }

  await Notifications.setNotificationChannelAsync('routeflow-reminders', {
    name: 'Route reminders',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#22d3ee',
  });
}

export async function clearFirstRideSummaryNotifications() {
  if (!isSupportedPlatform()) {
    return;
  }

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const matching = scheduled.filter(
    (request) => request.content.data?.routeFlowType === FIRST_RIDE_SUMMARY_TYPE
  );

  await Promise.all(
    matching.map((request) => Notifications.cancelScheduledNotificationAsync(request.identifier))
  );
}

export async function syncFirstRideSummaryNotification(
  rides: RideOccurrenceView[],
  preferences: DriverPreferences
) {
  if (!isSupportedPlatform()) {
    return;
  }

  await clearFirstRideSummaryNotifications();

  if (!preferences.notificationsEnabled || !preferences.firstRideSummaryEnabled) {
    return;
  }

  const permission = await Notifications.getPermissionsAsync();
  const granted =
    permission.granted || permission.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;

  if (!granted) {
    return;
  }

  const candidate = getFirstRideSummaryCandidate(
    rides,
    preferences.firstRideSummaryLeadTimeMinutes,
    new Date()
  );

  if (!candidate) {
    return;
  }

  const { firstRide, totalRides, triggerAt } = candidate;
  const rideLabel = totalRides === 1 ? 'ride' : 'rides';

  await Notifications.scheduleNotificationAsync({
    content: {
      title: `You have ${totalRides} ${rideLabel} today`,
      body: `First pickup is ${firstRide.group.riderName} at ${formatTime(firstRide.activeLeg.pickupTime)} on ${getLongDateLabel(firstRide.occurrence.serviceDate)}.`,
      sound: true,
      data: {
        routeFlowType: FIRST_RIDE_SUMMARY_TYPE,
        occurrenceId: firstRide.occurrence.id,
      },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerAt,
      channelId: Platform.OS === 'android' ? 'routeflow-reminders' : undefined,
    },
  });
}
