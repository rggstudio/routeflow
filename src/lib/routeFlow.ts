import { Alert, Linking, Share } from 'react-native';

import { DriverPreferences, NavigationApp, RideOccurrenceView, RideStatus } from '@/types/ride';

function encode(value: string) {
  return encodeURIComponent(value);
}

export function getStatusLabel(status: RideStatus) {
  switch (status) {
    case 'scheduled':
      return 'Scheduled';
    case 'in_progress':
      return 'In Progress';
    case 'completed':
      return 'Completed';
    case 'canceled':
      return 'Canceled';
    case 'canceled_paid':
      return 'Canceled with Pay';
    default:
      return status;
  }
}

export async function openNavigation(view: RideOccurrenceView, preferences: DriverPreferences) {
  const origin = view.activeLeg.pickupAddress;
  const destination = view.activeLeg.dropoffAddress;

  const urls: Record<NavigationApp, string> = {
    waze: `https://waze.com/ul?ll=${encode(destination)}&navigate=yes`,
    google_maps: `https://www.google.com/maps/dir/?api=1&origin=${encode(origin)}&destination=${encode(destination)}&travelmode=driving`,
    apple_maps: `http://maps.apple.com/?saddr=${encode(origin)}&daddr=${encode(destination)}`,
  };

  const preferredUrl = urls[preferences.defaultNavigationApp];
  const fallbackUrls = Object.values(urls).filter((url) => url !== preferredUrl);
  const candidates = [preferredUrl, ...fallbackUrls];

  for (const url of candidates) {
    const supported = await Linking.canOpenURL(url);

    if (supported) {
      await Linking.openURL(url);
      return;
    }
  }

  Alert.alert('No map app available', 'RouteFlow could not open a navigation app on this device.');
}

export async function sendQuickMessage(phone: string, body: string) {
  if (!phone.trim()) {
    Alert.alert('No phone number', 'Add a rider phone number to use quick messaging.');
    return;
  }

  const url = `sms:${phone}?body=${encode(body)}`;
  const supported = await Linking.canOpenURL(url);

  if (!supported) {
    Alert.alert('SMS unavailable', 'This device cannot open the messaging app right now.');
    return;
  }

  await Linking.openURL(url);
}

export function buildQuickMessage(type: 'on_my_way' | 'five_min_away' | 'picked_up' | 'eta', view: RideOccurrenceView) {
  const riderName = view.group.riderName;

  switch (type) {
    case 'on_my_way':
      return `Hi ${riderName}, I am on my way for your ride.`;
    case 'five_min_away':
      return `Hi ${riderName}, I am about 5 minutes away.`;
    case 'picked_up':
      return `Hi ${riderName}, you have been picked up and we are on the way.`;
    case 'eta':
      return `Hi ${riderName}, my ETA is ${view.activeLeg.pickupTime}.`;
    default:
      return `Hi ${riderName}, I am on the way.`;
  }
}

export async function shareReport(text: string) {
  await Share.share({ message: text });
}
