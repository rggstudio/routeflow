import { ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import {
  addDays,
  combineDateAndTime,
  compareTime,
  DEFAULT_FIRST_RIDE_SUMMARY_TIME,
  fromIsoDate,
  isMorningSummaryTime,
  toIsoDate,
  todayIso,
} from '@/lib/date';
import { configureNotificationChannel, syncFirstRideSummaryNotification } from '@/lib/notifications';
import { getRecurringDatesForWindow, normalizeRecurrenceDays } from '@/lib/recurrence';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/providers/SessionProvider';
import {
  DriverPreferences,
  DriverProfile,
  RideDraft,
  RideOccurrenceView,
  RideStatus,
  RouteFlowState,
  TripGroup,
  TripLeg,
  TripOccurrence,
} from '@/types/ride';
import { Tables, TablesInsert } from '@/types/supabase';

const RECURRING_LOOKAHEAD_DAYS = 90;
const OWNER_ADMIN_EMAIL = 'shopmaster73@gmail.com';

type TripGroupRow = Tables<'trip_groups'>;
type TripOccurrenceRow = Tables<'trip_occurrences'>;
type TripLegRow = Tables<'trip_legs'>;
type ProfileRow = Tables<'profiles'>;
type DriverPreferencesRow = Tables<'driver_preferences'>;

type WeekMetrics = {
  totalEarnings: number;
  totalRides: number;
  completedRides: number;
  canceledRides: number;
  rides: RideOccurrenceView[];
};

type UpdatePreferencesResult = {
  warning?: string;
};

type RouteFlowContextValue = {
  state: RouteFlowState;
  isHydrated: boolean;
  getOccurrenceView: (occurrenceId: string) => RideOccurrenceView | null;
  getOccurrencesForDate: (isoDate: string) => RideOccurrenceView[];
  getCanceledOccurrencesForDate: (isoDate: string) => RideOccurrenceView[];
  getOccurrencesForWeek: (weekStartIso: string) => RideOccurrenceView[];
  getUpcomingOccurrences: () => RideOccurrenceView[];
  getWeekMetrics: (weekStartIso: string) => WeekMetrics;
  createDraftForGroup: (groupId?: string) => RideDraft;
  addRide: (draft: RideDraft) => Promise<void>;
  updateRide: (groupId: string, draft: RideDraft) => Promise<void>;
  updateOccurrenceStatus: (occurrenceId: string, status: RideStatus) => Promise<void>;
  cancelOccurrence: (occurrenceId: string) => Promise<void>;
  cancelOccurrenceWithPay: (occurrenceId: string) => Promise<void>;
  deleteSeriesFromOccurrence: (occurrenceId: string) => Promise<void>;
  updateProfile: (profile: DriverProfile) => Promise<void>;
  updatePreferences: (preferences: DriverPreferences) => Promise<UpdatePreferencesResult>;
};

const RouteFlowContext = createContext<RouteFlowContextValue | undefined>(undefined);

type RouteFlowProviderProps = {
  children: ReactNode;
};

function createUuid() {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    const value = char === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

function isCanceledStatus(status: RideStatus) {
  return status === 'canceled' || status === 'canceled_paid';
}

function createEmptyState(fallbackName = '', isAdmin = false): RouteFlowState {
  return {
    profile: {
      name: fallbackName,
      phone: '',
      avatarUrl: '',
      isAdmin,
    },
    preferences: {
      defaultNavigationApp: 'google_maps',
      notificationsEnabled: true,
      firstRideSummaryEnabled: true,
      firstRideSummaryTime: DEFAULT_FIRST_RIDE_SUMMARY_TIME,
    },
    tripGroups: [],
    tripOccurrences: [],
    tripLegs: [],
  };
}

function mapProfile(profile: ProfileRow | null, fallbackName = '', isAdminFallback = false): DriverProfile {
  return {
    name: profile?.full_name ?? fallbackName,
    phone: profile?.phone ?? '',
    avatarUrl: profile?.avatar_url ?? '',
    isAdmin: profile?.is_admin ?? isAdminFallback,
  };
}

function mapPreferences(preferences: DriverPreferencesRow | null): DriverPreferences {
  const firstRideSummaryTime = preferences?.first_ride_summary_time;

  return {
    defaultNavigationApp:
      (preferences?.default_navigation_app as DriverPreferences['defaultNavigationApp']) ??
      'google_maps',
    notificationsEnabled: preferences?.notifications_enabled ?? true,
    firstRideSummaryEnabled: preferences?.first_ride_summary_enabled ?? true,
    firstRideSummaryTime:
      firstRideSummaryTime && isMorningSummaryTime(firstRideSummaryTime)
        ? firstRideSummaryTime
        : DEFAULT_FIRST_RIDE_SUMMARY_TIME,
  };
}

function mapTripGroups(rows: TripGroupRow[]): TripGroup[] {
  return rows.map((row) => {
    const legacyType = row.recurrence_type;
    const recurrenceType: TripGroup['recurrenceType'] =
      legacyType === 'monthly' ? 'monthly' : legacyType === 'none' ? 'none' : 'weekly';
    const recurrenceDays =
      legacyType === 'weekday' ? [1, 2, 3, 4, 5] : row.recurrence_days;

    return {
      id: row.id,
      driverId: row.driver_id,
      riderName: row.rider_name,
      phone: row.phone ?? '',
      tripType: row.trip_type as TripGroup['tripType'],
      payAmount: row.pay_amount,
      recurrenceType,
      recurrenceInterval: row.recurrence_interval ?? 1,
      recurrenceDays,
      recurrenceMonthlyMode: row.recurrence_monthly_mode as TripGroup['recurrenceMonthlyMode'],
      recurrenceAnchorDate: row.recurrence_anchor_date ?? todayIso(),
      recurrenceEndDate: row.recurrence_end_date ?? null,
      notes: row.notes,
      createdAt: row.created_at,
    };
  });
}

function mapTripOccurrences(rows: TripOccurrenceRow[]): TripOccurrence[] {
  return rows.map((row) => ({
    id: row.id,
    tripGroupId: row.trip_group_id,
    serviceDate: row.service_date,
    status: row.status as RideStatus,
    overridePayAmount: row.override_pay_amount,
    pickedUpAt: row.picked_up_at,
    completedAt: row.completed_at,
  }));
}

function mapTripLegs(rows: TripLegRow[]): TripLeg[] {
  return rows.map((row) => ({
    id: row.id,
    tripOccurrenceId: row.trip_occurrence_id,
    legType: row.leg_type as TripLeg['legType'],
    pickupAddress: row.pickup_address,
    dropoffAddress: row.dropoff_address,
    pickupTime: row.pickup_time.slice(0, 5),
    status: row.status as RideStatus,
  }));
}

function splitRoundTripPay(totalAmount: number) {
  const totalCents = Math.round(totalAmount * 100);
  const outboundCents = Math.floor(totalCents / 2);
  const returnCents = totalCents - outboundCents;

  return {
    outbound: outboundCents / 100,
    return: returnCents / 100,
  };
}

function isOwnerEmail(email?: string | null) {
  return email?.trim().toLowerCase() === OWNER_ADMIN_EMAIL;
}

function isMissingColumnError(
  error: { message?: string | null; details?: string | null; hint?: string | null } | null,
  columnName: string
) {
  const haystack = [error?.message, error?.details, error?.hint].filter(Boolean).join(' ').toLowerCase();
  return haystack.includes(columnName.toLowerCase());
}

function buildRecurrenceRule(input: {
  recurrenceType: RideDraft['recurrenceType'];
  recurrenceInterval: RideDraft['recurrenceInterval'];
  recurrenceDays: RideDraft['recurrenceDays'];
  recurrenceMonthlyMode: RideDraft['recurrenceMonthlyMode'];
  recurrenceAnchorDate: string;
  recurrenceEndDate?: string | null;
}) {
  const recurrenceType = input.recurrenceType;

  return {
    recurrenceType,
    recurrenceInterval:
      recurrenceType === 'weekly' ? (input.recurrenceInterval === 2 ? 2 : 1) : 1,
    recurrenceDays:
      recurrenceType === 'weekly' ? normalizeRecurrenceDays(input.recurrenceDays) : [],
    recurrenceMonthlyMode:
      recurrenceType === 'monthly' ? input.recurrenceMonthlyMode ?? 'day_of_month' : null,
    recurrenceAnchorDate: input.recurrenceAnchorDate,
    recurrenceEndDate: input.recurrenceEndDate ?? null,
  };
}

function buildOccurrencesAndLegsForServiceDates(
  draft: RideDraft,
  groupId: string,
  dates: string[]
) {
  const occurrences: TablesInsert<'trip_occurrences'>[] = [];
  const legs: TablesInsert<'trip_legs'>[] = [];
  const payAmount = Number(draft.payAmount || '0');
  const splitPay = splitRoundTripPay(payAmount);

  for (const serviceDate of dates) {
    const outboundOccurrenceId = createUuid();
    occurrences.push({
      id: outboundOccurrenceId,
      trip_group_id: groupId,
      service_date: serviceDate,
      status: 'scheduled',
      override_pay_amount: draft.tripType === 'round_trip' ? splitPay.outbound : null,
    });

    legs.push({
      id: createUuid(),
      trip_occurrence_id: outboundOccurrenceId,
      leg_type: 'outbound',
      pickup_address: draft.pickupAddress.trim(),
      dropoff_address: draft.dropoffAddress.trim(),
      pickup_time: draft.pickupTime.trim(),
      status: 'scheduled',
    });

    if (draft.tripType === 'round_trip') {
      const returnOccurrenceId = createUuid();
      occurrences.push({
        id: returnOccurrenceId,
        trip_group_id: groupId,
        service_date: serviceDate,
        status: 'scheduled',
        override_pay_amount: splitPay.return,
      });

      legs.push({
        id: createUuid(),
        trip_occurrence_id: returnOccurrenceId,
        leg_type: 'return',
        pickup_address: draft.dropoffAddress.trim(),
        dropoff_address: draft.returnDropoffAddress.trim() || draft.pickupAddress.trim(),
        pickup_time: draft.returnPickupTime.trim(),
        status: 'scheduled',
      });
    }
  }

  return { occurrences, legs };
}

function getSortedViews(state: RouteFlowState) {
  const groupMap = new Map(state.tripGroups.map((group) => [group.id, group]));
  const legsByOccurrence = new Map<string, TripLeg[]>();

  for (const leg of state.tripLegs) {
    const current = legsByOccurrence.get(leg.tripOccurrenceId) ?? [];
    current.push(leg);
    legsByOccurrence.set(leg.tripOccurrenceId, current);
  }

  const baseViews: RideOccurrenceView[] = [];

  for (const occurrence of state.tripOccurrences) {
    const group = groupMap.get(occurrence.tripGroupId);

    if (!group) {
      continue;
    }

    const legs = [...(legsByOccurrence.get(occurrence.id) ?? [])].sort((a, b) =>
      compareTime(a.pickupTime, b.pickupTime)
    );
    const activeLeg = legs[0];

    if (!activeLeg) {
      continue;
    }

    const splitPay = splitRoundTripPay(group.payAmount);
    const effectivePay =
      occurrence.overridePayAmount ??
      (group.tripType === 'round_trip' && legs.length === 1
        ? splitPay[activeLeg.legType]
        : group.payAmount);

    baseViews.push({
      occurrence,
      group,
      legs,
      activeLeg,
      pairedLeg: null,
      effectivePay,
    });
  }

  return baseViews
    .map((view) => {
      const pairedLegFromSameOccurrence = view.legs.find((leg) => leg.id !== view.activeLeg.id) ?? null;

      if (pairedLegFromSameOccurrence) {
        return {
          ...view,
          pairedLeg: pairedLegFromSameOccurrence,
        };
      }

      const pairedView = baseViews.find(
        (candidate) =>
          candidate.occurrence.id !== view.occurrence.id &&
          candidate.group.id === view.group.id &&
          candidate.occurrence.serviceDate === view.occurrence.serviceDate &&
          candidate.activeLeg.legType !== view.activeLeg.legType
      );

      return {
        ...view,
        pairedLeg: pairedView?.activeLeg ?? null,
      };
    })
    .sort((a, b) => {
      if (a.occurrence.serviceDate === b.occurrence.serviceDate) {
        return compareTime(a.activeLeg.pickupTime, b.activeLeg.pickupTime);
      }

      return a.occurrence.serviceDate.localeCompare(b.occurrence.serviceDate);
    });
}

function validateDraft(draft: RideDraft) {
  if (!draft.riderName.trim()) {
    throw new Error('Rider name is required.');
  }

  if (!draft.pickupAddress.trim() || !draft.dropoffAddress.trim()) {
    throw new Error('Pickup and dropoff are required.');
  }

  if (!draft.pickupTime.trim() || !draft.serviceDate.trim()) {
    throw new Error('Service date and pickup time are required.');
  }

  if (draft.tripType === 'round_trip' && !draft.returnPickupTime.trim()) {
    throw new Error('Return pickup time is required for round trips.');
  }

  if (draft.recurrenceType === 'weekly' && normalizeRecurrenceDays(draft.recurrenceDays).length === 0) {
    throw new Error(
      draft.recurrenceInterval === 2
        ? 'Choose at least one day for every 2 weeks.'
        : 'Choose at least one weekly day.'
    );
  }

  if (draft.recurrenceType === 'monthly' && !draft.recurrenceMonthlyMode) {
    throw new Error('Choose how the monthly ride should repeat.');
  }
}

function buildInsertPayload(
  draft: RideDraft,
  driverId: string,
  existingGroupId?: string,
  options?: {
    generationStartIso?: string;
    excludedDates?: Set<string>;
    recurrenceEndDate?: string | null;
  }
) {
  validateDraft(draft);

  const groupId = existingGroupId ?? createUuid();
  const payAmount = Number(draft.payAmount || '0');
  const recurrenceRule = buildRecurrenceRule({
    recurrenceType: draft.recurrenceType,
    recurrenceInterval: draft.recurrenceInterval,
    recurrenceDays: draft.recurrenceDays,
    recurrenceMonthlyMode: draft.recurrenceMonthlyMode,
    recurrenceAnchorDate: draft.serviceDate,
    recurrenceEndDate: options?.recurrenceEndDate,
  });

  const group: TablesInsert<'trip_groups'> = {
    id: groupId,
    driver_id: driverId,
    rider_name: draft.riderName.trim(),
    phone: draft.phone.trim(),
    trip_type: draft.tripType,
    pay_amount: payAmount,
    recurrence_type: recurrenceRule.recurrenceType,
    recurrence_interval: recurrenceRule.recurrenceInterval,
    recurrence_days: recurrenceRule.recurrenceDays,
    recurrence_monthly_mode: recurrenceRule.recurrenceMonthlyMode,
    recurrence_anchor_date: recurrenceRule.recurrenceAnchorDate,
    recurrence_end_date: recurrenceRule.recurrenceEndDate,
    notes: draft.notes.trim(),
  };

  const dates: string[] = [];

  if (recurrenceRule.recurrenceType === 'none') {
    dates.push(draft.serviceDate);
  } else {
    dates.push(
      ...getRecurringDatesForWindow(
        recurrenceRule,
        options?.generationStartIso ?? draft.serviceDate,
        RECURRING_LOOKAHEAD_DAYS
      )
    );
  }
  const filteredDates = options?.excludedDates
    ? dates.filter((date) => !options.excludedDates?.has(date))
    : dates;
  const { occurrences, legs } = buildOccurrencesAndLegsForServiceDates(draft, groupId, filteredDates);

  return { group, occurrences, legs };
}

function createDefaultDraft(): RideDraft {
  return {
    riderName: '',
    phone: '',
    tripType: 'single',
    pickupAddress: '',
    dropoffAddress: '',
    pickupTime: '08:00',
    returnPickupTime: '15:00',
    returnDropoffAddress: '',
    payAmount: '',
    recurrenceType: 'none',
    recurrenceInterval: 1,
    recurrenceDays: [],
    recurrenceMonthlyMode: null,
    serviceDate: todayIso(),
    notes: '',
  };
}

function createDraftFromGroup(state: RouteFlowState, groupId?: string): RideDraft {
  if (!groupId) {
    return createDefaultDraft();
  }

  const group = state.tripGroups.find((item) => item.id === groupId);

  if (!group) {
    return createDefaultDraft();
  }

  const legsByOccurrence = new Map<string, TripLeg[]>();

  for (const leg of state.tripLegs) {
    const current = legsByOccurrence.get(leg.tripOccurrenceId) ?? [];
    current.push(leg);
    legsByOccurrence.set(leg.tripOccurrenceId, current);
  }

  const legEntries = state.tripOccurrences
    .filter((occurrence) => occurrence.tripGroupId === groupId)
    .flatMap((occurrence) =>
      (legsByOccurrence.get(occurrence.id) ?? []).map((leg) => ({ occurrence, leg }))
    )
    .sort((a, b) => {
      if (a.occurrence.serviceDate === b.occurrence.serviceDate) {
        return compareTime(a.leg.pickupTime, b.leg.pickupTime);
      }

      return a.occurrence.serviceDate.localeCompare(b.occurrence.serviceDate);
    });

  const outboundEntry = legEntries.find((entry) => entry.leg.legType === 'outbound') ?? legEntries[0];
  const returnEntry = legEntries.find((entry) => entry.leg.legType === 'return');

  if (!outboundEntry) {
    return createDefaultDraft();
  }

  return {
    riderName: group.riderName,
    phone: group.phone,
    tripType: group.tripType,
    pickupAddress: outboundEntry.leg.pickupAddress,
    dropoffAddress: outboundEntry.leg.dropoffAddress,
    pickupTime: outboundEntry.leg.pickupTime,
    returnPickupTime: returnEntry?.leg.pickupTime ?? '15:00',
    returnDropoffAddress: returnEntry?.leg.dropoffAddress ?? outboundEntry.leg.pickupAddress,
    payAmount: String(group.payAmount),
    recurrenceType: group.recurrenceType,
    recurrenceInterval: group.recurrenceInterval,
    recurrenceDays: group.recurrenceDays,
    recurrenceMonthlyMode: group.recurrenceMonthlyMode,
    serviceDate:
      group.recurrenceType === 'none'
        ? outboundEntry.occurrence.serviceDate
        : group.recurrenceAnchorDate,
    notes: group.notes,
  };
}

function getWeekMetrics(weekStartIso: string, rides: RideOccurrenceView[]): WeekMetrics {
  const weekStart = fromIsoDate(weekStartIso);
  const weekEndIso = toIsoDate(addDays(weekStart, 6));
  const weekRides = rides.filter(
    (ride) =>
      ride.occurrence.serviceDate >= weekStartIso && ride.occurrence.serviceDate <= weekEndIso
  );

  return {
    totalEarnings: weekRides
      .filter((ride) => ride.occurrence.status !== 'canceled')
      .reduce((sum, ride) => sum + ride.effectivePay, 0),
    totalRides: weekRides.length,
    completedRides: weekRides.filter((ride) => ride.occurrence.status === 'completed').length,
    canceledRides: weekRides.filter((ride) => isCanceledStatus(ride.occurrence.status)).length,
    rides: weekRides,
  };
}

export function RouteFlowProvider({ children }: RouteFlowProviderProps) {
  const { session } = useSession();
  const [state, setState] = useState<RouteFlowState>(createEmptyState());
  const [isHydrated, setIsHydrated] = useState(false);

  const requireSignedInClient = useCallback(() => {
    if (!supabase || !session) {
      throw new Error('Sign in to sync RouteFlow with Supabase.');
    }

    return {
      client: supabase,
      userId: session.user.id,
    };
  }, [session]);

  const syncRecurringCoverage = useCallback(
    async (nextState: RouteFlowState) => {
      if (!supabase || !session) {
        return false;
      }

      const today = todayIso();
      let newOccurrences: TablesInsert<'trip_occurrences'>[] = [];
      let newLegs: TablesInsert<'trip_legs'>[] = [];

      for (const group of nextState.tripGroups) {
        if (group.recurrenceType === 'none') {
          continue;
        }

        const draft = createDraftFromGroup(nextState, group.id);
        const recurrenceRule = buildRecurrenceRule({
          recurrenceType: group.recurrenceType,
          recurrenceInterval: group.recurrenceInterval,
          recurrenceDays: group.recurrenceDays,
          recurrenceMonthlyMode: group.recurrenceMonthlyMode,
          recurrenceAnchorDate: group.recurrenceAnchorDate,
          recurrenceEndDate: group.recurrenceEndDate,
        });
        const windowStartIso = today;
        const windowEndIso = toIsoDate(
          addDays(fromIsoDate(windowStartIso), RECURRING_LOOKAHEAD_DAYS - 1)
        );
        const existingDates = new Set(
          nextState.tripOccurrences
            .filter(
              (occurrence) =>
                occurrence.tripGroupId === group.id &&
                occurrence.serviceDate >= windowStartIso &&
                occurrence.serviceDate <= windowEndIso
            )
            .map((occurrence) => occurrence.serviceDate)
        );
        const desiredDates = getRecurringDatesForWindow(
          recurrenceRule,
          windowStartIso,
          RECURRING_LOOKAHEAD_DAYS
        );
        const missingDates = desiredDates.filter((serviceDate) => !existingDates.has(serviceDate));

        if (missingDates.length === 0) {
          continue;
        }

        const payload = buildOccurrencesAndLegsForServiceDates(draft, group.id, missingDates);
        newOccurrences = [...newOccurrences, ...payload.occurrences];
        newLegs = [...newLegs, ...payload.legs];
      }

      if (newOccurrences.length === 0 || newLegs.length === 0) {
        return false;
      }

      const { error: occurrenceError } = await supabase
        .from('trip_occurrences')
        .insert(newOccurrences);

      if (occurrenceError) {
        throw occurrenceError;
      }

      const { error: legsError } = await supabase.from('trip_legs').insert(newLegs);

      if (legsError) {
        throw legsError;
      }

      return true;
    },
    [session]
  );

  const loadState = useCallback(async () => {
    const fallbackName = session?.user.email?.split('@')[0] ?? '';
    const isAdminFallback = isOwnerEmail(session?.user.email);

    if (!supabase || !session) {
      setState(createEmptyState(fallbackName, isAdminFallback));
      setIsHydrated(true);
      return;
    }

    setIsHydrated(false);

    try {
      const [
        profileResult,
        preferencesResult,
        tripGroupsResult,
        tripOccurrencesResult,
        tripLegsResult,
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle(),
        supabase.from('driver_preferences').select('*').eq('driver_id', session.user.id).maybeSingle(),
        supabase.from('trip_groups').select('*').order('created_at', { ascending: true }),
        supabase.from('trip_occurrences').select('*').order('service_date', { ascending: true }),
        supabase.from('trip_legs').select('*').order('pickup_time', { ascending: true }),
      ]);

      if (profileResult.error) {
        throw profileResult.error;
      }

      if (preferencesResult.error) {
        throw preferencesResult.error;
      }

      if (tripGroupsResult.error) {
        throw tripGroupsResult.error;
      }

      if (tripOccurrencesResult.error) {
        throw tripOccurrencesResult.error;
      }

      if (tripLegsResult.error) {
        throw tripLegsResult.error;
      }

      let nextState: RouteFlowState = {
        profile: mapProfile(profileResult.data, fallbackName, isAdminFallback),
        preferences: mapPreferences(preferencesResult.data),
        tripGroups: mapTripGroups(tripGroupsResult.data ?? []),
        tripOccurrences: mapTripOccurrences(tripOccurrencesResult.data ?? []),
        tripLegs: mapTripLegs(tripLegsResult.data ?? []),
      };

      const didExtendRecurringCoverage = await syncRecurringCoverage(nextState);

      if (didExtendRecurringCoverage) {
        const [refreshedOccurrencesResult, refreshedLegsResult] = await Promise.all([
          supabase.from('trip_occurrences').select('*').order('service_date', { ascending: true }),
          supabase.from('trip_legs').select('*').order('pickup_time', { ascending: true }),
        ]);

        if (refreshedOccurrencesResult.error) {
          throw refreshedOccurrencesResult.error;
        }

        if (refreshedLegsResult.error) {
          throw refreshedLegsResult.error;
        }

        nextState = {
          ...nextState,
          tripOccurrences: mapTripOccurrences(refreshedOccurrencesResult.data ?? []),
          tripLegs: mapTripLegs(refreshedLegsResult.data ?? []),
        };
      }

      setState(nextState);
    } catch (error) {
      console.error('Failed to load RouteFlow state from Supabase', error);
      setState(createEmptyState(fallbackName, isAdminFallback));
    } finally {
      setIsHydrated(true);
    }
  }, [session, syncRecurringCoverage]);

  const setOccurrenceStatus = useCallback(
    async (occurrenceId: string, status: RideStatus) => {
      const { client } = requireSignedInClient();

      const { data: updatedOccurrences, error: occurrenceError } = await client
        .from('trip_occurrences')
        .update({ status })
        .eq('id', occurrenceId)
        .select('id');

      if (occurrenceError) {
        throw new Error(occurrenceError.message ?? 'Failed to update ride status.');
      }

      if (!updatedOccurrences || updatedOccurrences.length === 0) {
        throw new Error('Ride not found or you do not have permission to update it.');
      }

      const { error: legsError } = await client
        .from('trip_legs')
        .update({ status })
        .eq('trip_occurrence_id', occurrenceId);

      if (legsError) {
        throw new Error(legsError.message ?? 'Failed to update ride legs.');
      }

      await loadState();
    },
    [loadState, requireSignedInClient]
  );

  useEffect(() => {
    void loadState();
  }, [loadState]);

  useEffect(() => {
    void configureNotificationChannel();
  }, []);

  const sortedViews = useMemo(() => getSortedViews(state), [state]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    void syncFirstRideSummaryNotification(sortedViews, state.preferences);
  }, [isHydrated, sortedViews, state.preferences]);

  const value = useMemo<RouteFlowContextValue>(
    () => ({
      state,
      isHydrated,
      getOccurrenceView: (occurrenceId) =>
        sortedViews.find((ride) => ride.occurrence.id === occurrenceId) ?? null,
      getOccurrencesForDate: (isoDate) =>
        sortedViews.filter(
          (ride) => ride.occurrence.serviceDate === isoDate && !isCanceledStatus(ride.occurrence.status)
        ),
      getCanceledOccurrencesForDate: (isoDate) =>
        sortedViews.filter(
          (ride) => ride.occurrence.serviceDate === isoDate && isCanceledStatus(ride.occurrence.status)
        ),
      getOccurrencesForWeek: (weekStartIso) => getWeekMetrics(weekStartIso, sortedViews).rides,
      getUpcomingOccurrences: () => {
        const now = new Date();
        const today = todayIso();

        return sortedViews.filter((ride) => {
          if (
            ride.occurrence.status === 'completed' ||
            isCanceledStatus(ride.occurrence.status)
          ) {
            return false;
          }

          if (ride.occurrence.serviceDate > today) {
            return true;
          }

          if (ride.occurrence.serviceDate < today) {
            return false;
          }

          return combineDateAndTime(ride.occurrence.serviceDate, ride.activeLeg.pickupTime) >= now;
        });
      },
      getWeekMetrics: (weekStartIso) => getWeekMetrics(weekStartIso, sortedViews),
      createDraftForGroup: (groupId) => createDraftFromGroup(state, groupId),
      addRide: async (draft) => {
        const { client, userId } = requireSignedInClient();
        const payload = buildInsertPayload(draft, userId);

        const { error: groupError } = await client.from('trip_groups').insert(payload.group);

        if (groupError) {
          throw groupError;
        }

        if (payload.occurrences.length > 0) {
          const { error: occurrencesError } = await client
            .from('trip_occurrences')
            .insert(payload.occurrences);

          if (occurrencesError) {
            throw occurrencesError;
          }

          const { error: legsError } = await client.from('trip_legs').insert(payload.legs);

          if (legsError) {
            throw legsError;
          }
        }

        await loadState();
      },
      updateRide: async (groupId, draft) => {
        const { client, userId } = requireSignedInClient();
        const currentGroup = state.tripGroups.find((group) => group.id === groupId);
        const isOneTimeRide = draft.recurrenceType === 'none';
        const cutoffIso = todayIso();
        const deletableOccurrences = state.tripOccurrences.filter((occurrence) => {
          if (occurrence.tripGroupId !== groupId) {
            return false;
          }

          if (isOneTimeRide) {
            return true;
          }

          return (
            occurrence.serviceDate > cutoffIso ||
            (occurrence.serviceDate === cutoffIso && occurrence.status === 'scheduled')
          );
        });
        const preservedDates = new Set(
          state.tripOccurrences
            .filter(
              (occurrence) =>
                occurrence.tripGroupId === groupId &&
                !deletableOccurrences.some((candidate) => candidate.id === occurrence.id)
            )
            .map((occurrence) => occurrence.serviceDate)
        );
        const payload = buildInsertPayload(draft, userId, groupId, {
          generationStartIso: isOneTimeRide ? draft.serviceDate : cutoffIso,
          excludedDates: isOneTimeRide ? undefined : preservedDates,
          recurrenceEndDate:
            isOneTimeRide || !currentGroup?.recurrenceEndDate ? null : currentGroup.recurrenceEndDate,
        });
        const { id: _groupId, ...groupUpdate } = payload.group;

        const { error: groupError } = await client
          .from('trip_groups')
          .update(groupUpdate)
          .eq('id', groupId);

        if (groupError) {
          throw groupError;
        }

        const existingOccurrenceIds = deletableOccurrences.map((occurrence) => occurrence.id);

        if (existingOccurrenceIds.length > 0) {
          const { error: deleteLegsError } = await client
            .from('trip_legs')
            .delete()
            .in('trip_occurrence_id', existingOccurrenceIds);

          if (deleteLegsError) {
            throw deleteLegsError;
          }
        }

        if (existingOccurrenceIds.length > 0) {
          const { error: deleteOccurrencesError } = await client
            .from('trip_occurrences')
            .delete()
            .in('id', existingOccurrenceIds);

          if (deleteOccurrencesError) {
            throw deleteOccurrencesError;
          }
        }

        if (payload.occurrences.length > 0) {
          const { error: occurrencesError } = await client
            .from('trip_occurrences')
            .insert(payload.occurrences);

          if (occurrencesError) {
            throw occurrencesError;
          }

          const { error: legsError } = await client.from('trip_legs').insert(payload.legs);

          if (legsError) {
            throw legsError;
          }
        }

        await loadState();
      },
      updateOccurrenceStatus: async (occurrenceId, status) => {
        await setOccurrenceStatus(occurrenceId, status);
      },
      cancelOccurrence: async (occurrenceId) => {
        await setOccurrenceStatus(occurrenceId, 'canceled');
      },
      cancelOccurrenceWithPay: async (occurrenceId) => {
        await setOccurrenceStatus(occurrenceId, 'canceled_paid');
      },
      deleteSeriesFromOccurrence: async (occurrenceId) => {
        const { client } = requireSignedInClient();
        const selectedOccurrence = state.tripOccurrences.find((occurrence) => occurrence.id === occurrenceId);

        if (!selectedOccurrence) {
          throw new Error('Ride not found or it was already removed.');
        }

        const group = state.tripGroups.find((item) => item.id === selectedOccurrence.tripGroupId);

        if (!group || group.recurrenceType === 'none') {
          throw new Error('Only recurring series can be deleted this way.');
        }

        const cutoffIso = selectedOccurrence.serviceDate;
        const recurrenceEndDate = toIsoDate(addDays(fromIsoDate(cutoffIso), -1));
        const occurrenceIds = state.tripOccurrences
          .filter(
            (occurrence) =>
              occurrence.tripGroupId === group.id && occurrence.serviceDate >= cutoffIso
          )
          .map((occurrence) => occurrence.id);

        const { error: groupError } = await client
          .from('trip_groups')
          .update({ recurrence_end_date: recurrenceEndDate })
          .eq('id', group.id);

        if (groupError) {
          throw groupError;
        }

        if (occurrenceIds.length > 0) {
          const { error: deleteLegsError } = await client
            .from('trip_legs')
            .delete()
            .in('trip_occurrence_id', occurrenceIds);

          if (deleteLegsError) {
            throw deleteLegsError;
          }

          const { error: deleteOccurrencesError } = await client
            .from('trip_occurrences')
            .delete()
            .in('id', occurrenceIds);

          if (deleteOccurrencesError) {
            throw deleteOccurrencesError;
          }
        }

        await loadState();
      },
      updateProfile: async (profile) => {
        const { client, userId } = requireSignedInClient();
        const payload: {
          full_name: string | null;
          phone: string | null;
          avatar_url?: string | null;
        } = {
          full_name: profile.name.trim() || null,
          phone: profile.phone.trim() || null,
        };

        if (profile.avatarUrl.trim()) {
          payload.avatar_url = profile.avatarUrl.trim();
        }

        const { data: updatedProfile, error: updateError } = await client
          .from('profiles')
          .update(payload)
          .eq('id', userId)
          .select('id')
          .maybeSingle();

        if (updateError) {
          throw new Error(updateError.message);
        }

        if (!updatedProfile) {
          const { error: insertError } = await client.from('profiles').insert({
            id: userId,
            ...payload,
          });

          if (insertError) {
            throw new Error(insertError.message);
          }
        }

        setState((current) => ({ ...current, profile }));
      },
      updatePreferences: async (preferences) => {
        const { client, userId } = requireSignedInClient();
        let warning: string | undefined;

        const { error } = await client.from('driver_preferences').upsert({
          driver_id: userId,
          default_navigation_app: preferences.defaultNavigationApp,
          notifications_enabled: preferences.notificationsEnabled,
          first_ride_summary_enabled: preferences.firstRideSummaryEnabled,
          first_ride_summary_time: preferences.firstRideSummaryTime,
        });

        if (error) {
          if (isMissingColumnError(error, 'first_ride_summary_time')) {
            const { error: legacyError } = await client.from('driver_preferences').upsert(
              {
                driver_id: userId,
                default_navigation_app: preferences.defaultNavigationApp,
                notifications_enabled: preferences.notificationsEnabled,
                first_ride_summary_enabled: preferences.firstRideSummaryEnabled,
                first_ride_summary_lead_time_minutes: 60,
              } as never
            );

            if (legacyError) {
              throw new Error(legacyError.message ?? 'Failed to save preferences.');
            }

            warning =
              'Your other preferences were saved, but morning summary time could not sync because the latest database migration has not been applied yet.';
          } else {
            throw new Error(error.message ?? 'Failed to save preferences.');
          }
        }

        setState((current) => ({ ...current, preferences }));
        return { warning };
      },
    }),
    [isHydrated, loadState, requireSignedInClient, setOccurrenceStatus, sortedViews, state]
  );

  return <RouteFlowContext.Provider value={value}>{children}</RouteFlowContext.Provider>;
}

export function useRouteFlow() {
  const context = useContext(RouteFlowContext);

  if (!context) {
    throw new Error('useRouteFlow must be used within RouteFlowProvider');
  }

  return context;
}
