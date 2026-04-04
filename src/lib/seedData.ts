import { addDays, getDefaultWeekdays, getStartOfWeek, toIsoDate } from '@/lib/date';
import { RouteFlowState } from '@/types/ride';

export function createInitialState(): RouteFlowState {
  const weekStart = getStartOfWeek(new Date());

  const monday = toIsoDate(weekStart);
  const tuesday = toIsoDate(addDays(weekStart, 1));
  const wednesday = toIsoDate(addDays(weekStart, 2));
  const friday = toIsoDate(addDays(weekStart, 4));

  return {
    profile: {
      name: 'Jamie Carter',
      phone: '(555) 010-2323',
      avatarUrl: '',
    },
    preferences: {
      defaultNavigationApp: 'waze',
      notificationsEnabled: true,
    },
    tripGroups: [
      {
        id: 'group-1',
        driverId: null,
        riderName: 'Mason Reed',
        phone: '(555) 010-1001',
        tripType: 'round_trip',
        payAmount: 68,
        recurrenceType: 'weekday',
        recurrenceDays: getDefaultWeekdays(),
        notes: 'Text parent before pickup.',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'group-2',
        driverId: null,
        riderName: 'Ava Thompson',
        phone: '(555) 010-1002',
        tripType: 'single',
        payAmount: 42,
        recurrenceType: 'none',
        recurrenceDays: [],
        notes: 'Court check-in ride.',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'group-3',
        driverId: null,
        riderName: 'Noah Lewis',
        phone: '(555) 010-1003',
        tripType: 'single',
        payAmount: 36,
        recurrenceType: 'custom',
        recurrenceDays: [1, 3, 5],
        notes: 'Day program pickup.',
        createdAt: new Date().toISOString(),
      },
    ],
    tripOccurrences: [
      { id: 'occ-1-out', tripGroupId: 'group-1', serviceDate: monday, status: 'scheduled', overridePayAmount: 34, pickedUpAt: null, completedAt: null },
      { id: 'occ-1-ret', tripGroupId: 'group-1', serviceDate: monday, status: 'scheduled', overridePayAmount: 34, pickedUpAt: null, completedAt: null },
      { id: 'occ-2-out', tripGroupId: 'group-1', serviceDate: tuesday, status: 'scheduled', overridePayAmount: 34, pickedUpAt: null, completedAt: null },
      { id: 'occ-2-ret', tripGroupId: 'group-1', serviceDate: tuesday, status: 'scheduled', overridePayAmount: 34, pickedUpAt: null, completedAt: null },
      { id: 'occ-3-out', tripGroupId: 'group-1', serviceDate: wednesday, status: 'scheduled', overridePayAmount: 34, pickedUpAt: null, completedAt: null },
      { id: 'occ-3-ret', tripGroupId: 'group-1', serviceDate: wednesday, status: 'scheduled', overridePayAmount: 34, pickedUpAt: null, completedAt: null },
      { id: 'occ-4-out', tripGroupId: 'group-1', serviceDate: friday, status: 'scheduled', overridePayAmount: 34, pickedUpAt: null, completedAt: null },
      { id: 'occ-4-ret', tripGroupId: 'group-1', serviceDate: friday, status: 'scheduled', overridePayAmount: 34, pickedUpAt: null, completedAt: null },
      { id: 'occ-5', tripGroupId: 'group-2', serviceDate: monday, status: 'completed', overridePayAmount: null, pickedUpAt: null, completedAt: null },
      { id: 'occ-6', tripGroupId: 'group-3', serviceDate: tuesday, status: 'scheduled', overridePayAmount: null, pickedUpAt: null, completedAt: null },
      { id: 'occ-7', tripGroupId: 'group-3', serviceDate: friday, status: 'canceled', overridePayAmount: null, pickedUpAt: null, completedAt: null },
    ],
    tripLegs: [
      { id: 'leg-1', tripOccurrenceId: 'occ-1-out', legType: 'outbound', pickupAddress: '1520 Oak Ridge Dr', dropoffAddress: 'Northview Middle School', pickupTime: '07:40', status: 'scheduled' },
      { id: 'leg-2', tripOccurrenceId: 'occ-1-ret', legType: 'return', pickupAddress: 'Northview Middle School', dropoffAddress: '1520 Oak Ridge Dr', pickupTime: '14:45', status: 'scheduled' },
      { id: 'leg-3', tripOccurrenceId: 'occ-2-out', legType: 'outbound', pickupAddress: '1520 Oak Ridge Dr', dropoffAddress: 'Northview Middle School', pickupTime: '07:40', status: 'scheduled' },
      { id: 'leg-4', tripOccurrenceId: 'occ-2-ret', legType: 'return', pickupAddress: 'Northview Middle School', dropoffAddress: '1520 Oak Ridge Dr', pickupTime: '14:45', status: 'scheduled' },
      { id: 'leg-5', tripOccurrenceId: 'occ-3-out', legType: 'outbound', pickupAddress: '1520 Oak Ridge Dr', dropoffAddress: 'Northview Middle School', pickupTime: '07:40', status: 'scheduled' },
      { id: 'leg-6', tripOccurrenceId: 'occ-3-ret', legType: 'return', pickupAddress: 'Northview Middle School', dropoffAddress: '1520 Oak Ridge Dr', pickupTime: '14:45', status: 'scheduled' },
      { id: 'leg-7', tripOccurrenceId: 'occ-4-out', legType: 'outbound', pickupAddress: '1520 Oak Ridge Dr', dropoffAddress: 'Northview Middle School', pickupTime: '07:40', status: 'scheduled' },
      { id: 'leg-8', tripOccurrenceId: 'occ-4-ret', legType: 'return', pickupAddress: 'Northview Middle School', dropoffAddress: '1520 Oak Ridge Dr', pickupTime: '14:45', status: 'scheduled' },
      { id: 'leg-9', tripOccurrenceId: 'occ-5', legType: 'outbound', pickupAddress: 'Family Services Center', dropoffAddress: 'Jefferson Courthouse', pickupTime: '09:15', status: 'completed' },
      { id: 'leg-10', tripOccurrenceId: 'occ-6', legType: 'outbound', pickupAddress: 'Greenwood Apartments', dropoffAddress: 'Riverbend Adult Day Program', pickupTime: '08:25', status: 'scheduled' },
      { id: 'leg-11', tripOccurrenceId: 'occ-7', legType: 'outbound', pickupAddress: 'Greenwood Apartments', dropoffAddress: 'Riverbend Adult Day Program', pickupTime: '08:25', status: 'canceled' },
    ],
  };
}
