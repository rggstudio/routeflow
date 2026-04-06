export type TripType = 'single' | 'round_trip';
export type RecurrenceType = 'none' | 'weekday' | 'custom';
export type RideStatus =
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'canceled'
  | 'canceled_paid';
export type LegType = 'outbound' | 'return';
export type NavigationApp = 'waze' | 'google_maps' | 'apple_maps';
export type FirstRideSummaryLeadTime = 15 | 30 | 60;

export type TripGroup = {
  id: string;
  driverId: string | null;
  riderName: string;
  phone: string;
  tripType: TripType;
  payAmount: number;
  recurrenceType: RecurrenceType;
  recurrenceDays: number[];
  notes: string;
  createdAt: string;
};

export type TripOccurrence = {
  id: string;
  tripGroupId: string;
  serviceDate: string;
  status: RideStatus;
  overridePayAmount: number | null;
  pickedUpAt: string | null;
  completedAt: string | null;
};

export type TripLeg = {
  id: string;
  tripOccurrenceId: string;
  legType: LegType;
  pickupAddress: string;
  dropoffAddress: string;
  pickupTime: string;
  status: RideStatus;
};

export type DriverProfile = {
  name: string;
  phone: string;
  avatarUrl: string;
  isAdmin: boolean;
};

export type DriverPreferences = {
  defaultNavigationApp: NavigationApp;
  notificationsEnabled: boolean;
  firstRideSummaryEnabled: boolean;
  firstRideSummaryLeadTimeMinutes: FirstRideSummaryLeadTime;
};

export type RideDraft = {
  riderName: string;
  phone: string;
  tripType: TripType;
  pickupAddress: string;
  dropoffAddress: string;
  pickupTime: string;
  returnPickupTime: string;
  returnDropoffAddress: string;
  payAmount: string;
  recurrenceType: RecurrenceType;
  recurrenceDays: number[];
  serviceDate: string;
  notes: string;
};

export type RouteFlowState = {
  profile: DriverProfile;
  preferences: DriverPreferences;
  tripGroups: TripGroup[];
  tripOccurrences: TripOccurrence[];
  tripLegs: TripLeg[];
};

export type RideOccurrenceView = {
  occurrence: TripOccurrence;
  group: TripGroup;
  legs: TripLeg[];
  activeLeg: TripLeg;
  pairedLeg: TripLeg | null;
  effectivePay: number;
};
