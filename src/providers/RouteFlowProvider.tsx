import { ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import {
  addDays,
  compareTime,
  fromIsoDate,
  getDefaultWeekdays,
  toIsoDate,
  todayIso,
} from '@/lib/date';
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

const OCCURRENCE_WINDOW_DAYS = 28;

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

type RouteFlowContextValue = {
  state: RouteFlowState;
  isHydrated: boolean;
  getOccurrenceView: (occurrenceId: string) => RideOccurrenceView | null;
  getOccurrencesForDate: (isoDate: string) => RideOccurrenceView[];
  getOccurrencesForWeek: (weekStartIso: string) => RideOccurrenceView[];
  getUpcomingOccurrences: () => RideOccurrenceView[];
  getWeekMetrics: (weekStartIso: string) => WeekMetrics;
  createDraftForGroup: (groupId?: string) => RideDraft;
  addRide: (draft: RideDraft) => Promise<void>;
  updateRide: (groupId: string, draft: RideDraft) => Promise<void>;
  updateOccurrenceStatus: (occurrenceId: string, status: RideStatus) => Promise<void>;
  cancelOccurrence: (occurrenceId: string) => Promise<void>;
  cancelOccurrenceWithPay: (occurrenceId: string) => Promise<void>;
  cancelSeries: (groupId: string) => Promise<void>;
  updateProfile: (profile: DriverProfile) => Promise<void>;
  updatePreferences: (preferences: DriverPreferences) => Promise<void>;
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

function createEmptyState(fallbackName = ''): RouteFlowState {
  return {
    profile: {
      name: fallbackName,
      phone: '',
    },
    preferences: {
      defaultNavigationApp: 'google_maps',
      notificationsEnabled: true,
    },
    tripGroups: [],
    tripOccurrences: [],
    tripLegs: [],
  };
}

function mapProfile(profile: ProfileRow | null, fallbackName = ''): DriverProfile {
  return {
    name: profile?.full_name ?? fallbackName,
    phone: profile?.phone ?? '',
  };
}

function mapPreferences(preferences: DriverPreferencesRow | null): DriverPreferences {
  return {
    defaultNavigationApp:
      (preferences?.default_navigation_app as DriverPreferences['defaultNavigationApp']) ??
      'google_maps',
    notificationsEnabled: preferences?.notifications_enabled ?? true,
  };
}

function mapTripGroups(rows: TripGroupRow[]): TripGroup[] {
  return rows.map((row) => ({
    id: row.id,
    driverId: row.driver_id,
    riderName: row.rider_name,
    phone: row.phone ?? '',
    tripType: row.trip_type as TripGroup['tripType'],
    payAmount: row.pay_amount,
    recurrenceType: row.recurrence_type as TripGroup['recurrenceType'],
    recurrenceDays: row.recurrence_days,
    notes: row.notes,
    createdAt: row.created_at,
  }));
}

function mapTripOccurrences(rows: TripOccurrenceRow[]): TripOccurrence[] {
  return rows.map((row) => ({
    id: row.id,
    tripGroupId: row.trip_group_id,
    serviceDate: row.service_date,
    status: row.status as RideStatus,
    overridePayAmount: row.override_pay_amount,
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

function getSortedViews(state: RouteFlowState) {
  const groupMap = new Map(state.tripGroups.map((group) => [group.id, group]));
  const legsByOccurrence = new Map<string, TripLeg[]>();

  for (const leg of state.tripLegs) {
    const current = legsByOccurrence.get(leg.tripOccurrenceId) ?? [];
    current.push(leg);
    legsByOccurrence.set(leg.tripOccurrenceId, current);
  }

  return state.tripOccurrences
    .map((occurrence) => {
      const group = groupMap.get(occurrence.tripGroupId);

      if (!group) {
        return null;
      }

      const legs = [...(legsByOccurrence.get(occurrence.id) ?? [])].sort((a, b) =>
        compareTime(a.pickupTime, b.pickupTime)
      );
      const outboundLeg = legs.find((leg) => leg.legType === 'outbound');

      if (!outboundLeg) {
        return null;
      }

      return {
        occurrence,
        group,
        legs,
        outboundLeg,
        returnLeg: legs.find((leg) => leg.legType === 'return') ?? null,
        effectivePay: occurrence.overridePayAmount ?? group.payAmount,
      };
    })
    .filter((view): view is RideOccurrenceView => view !== null)
    .sort((a, b) => {
      if (a.occurrence.serviceDate === b.occurrence.serviceDate) {
        return compareTime(a.outboundLeg.pickupTime, b.outboundLeg.pickupTime);
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

  if (draft.recurrenceType === 'custom' && draft.recurrenceDays.length === 0) {
    throw new Error('Choose at least one custom day.');
  }
}

function buildInsertPayload(draft: RideDraft, driverId: string, existingGroupId?: string) {
  validateDraft(draft);

  const groupId = existingGroupId ?? createUuid();
  const recurrenceDays =
    draft.recurrenceType === 'weekday'
      ? getDefaultWeekdays()
      : draft.recurrenceType === 'custom'
        ? [...draft.recurrenceDays].sort((a, b) => a - b)
        : [];

  const group: TablesInsert<'trip_groups'> = {
    id: groupId,
    driver_id: driverId,
    rider_name: draft.riderName.trim(),
    phone: draft.phone.trim(),
    trip_type: draft.tripType,
    pay_amount: Number(draft.payAmount || '0'),
    recurrence_type: draft.recurrenceType,
    recurrence_days: recurrenceDays,
    notes: draft.notes.trim(),
  };

  const startDate = fromIsoDate(draft.serviceDate);
  const dates: string[] = [];

  if (draft.recurrenceType === 'none') {
    dates.push(draft.serviceDate);
  } else {
    const allowed = new Set(recurrenceDays);

    for (let offset = 0; offset < OCCURRENCE_WINDOW_DAYS; offset += 1) {
      const next = addDays(startDate, offset);
      const day = next.getDay() === 0 ? 7 : next.getDay();

      if (allowed.has(day)) {
        dates.push(toIsoDate(next));
      }
    }
  }

  const occurrences: TablesInsert<'trip_occurrences'>[] = [];
  const legs: TablesInsert<'trip_legs'>[] = [];

  for (const serviceDate of dates) {
    const occurrenceId = createUuid();
    occurrences.push({
      id: occurrenceId,
      trip_group_id: groupId,
      service_date: serviceDate,
      status: 'scheduled',
      override_pay_amount: null,
    });

    legs.push({
      id: createUuid(),
      trip_occurrence_id: occurrenceId,
      leg_type: 'outbound',
      pickup_address: draft.pickupAddress.trim(),
      dropoff_address: draft.dropoffAddress.trim(),
      pickup_time: draft.pickupTime.trim(),
      status: 'scheduled',
    });

    if (draft.tripType === 'round_trip') {
      legs.push({
        id: createUuid(),
        trip_occurrence_id: occurrenceId,
        leg_type: 'return',
        pickup_address: draft.dropoffAddress.trim(),
        dropoff_address: draft.returnDropoffAddress.trim() || draft.pickupAddress.trim(),
        pickup_time: draft.returnPickupTime.trim(),
        status: 'scheduled',
      });
    }
  }

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
    recurrenceDays: [],
    serviceDate: todayIso(),
    notes: '',
  };
}

function createDraftFromView(view?: RideOccurrenceView): RideDraft {
  if (!view) {
    return createDefaultDraft();
  }

  return {
    riderName: view.group.riderName,
    phone: view.group.phone,
    tripType: view.group.tripType,
    pickupAddress: view.outboundLeg.pickupAddress,
    dropoffAddress: view.outboundLeg.dropoffAddress,
    pickupTime: view.outboundLeg.pickupTime,
    returnPickupTime: view.returnLeg?.pickupTime ?? '15:00',
    returnDropoffAddress: view.returnLeg?.dropoffAddress ?? view.outboundLeg.pickupAddress,
    payAmount: `${view.group.payAmount}`,
    recurrenceType: view.group.recurrenceType,
    recurrenceDays: view.group.recurrenceDays,
    serviceDate: view.occurrence.serviceDate,
    notes: view.group.notes,
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

  const loadState = useCallback(async () => {
    const fallbackName = session?.user.email?.split('@')[0] ?? '';

    if (!supabase || !session) {
      setState(createEmptyState(fallbackName));
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

      setState({
        profile: mapProfile(profileResult.data, fallbackName),
        preferences: mapPreferences(preferencesResult.data),
        tripGroups: mapTripGroups(tripGroupsResult.data ?? []),
        tripOccurrences: mapTripOccurrences(tripOccurrencesResult.data ?? []),
        tripLegs: mapTripLegs(tripLegsResult.data ?? []),
      });
    } catch (error) {
      console.error('Failed to load RouteFlow state from Supabase', error);
      setState(createEmptyState(fallbackName));
    } finally {
      setIsHydrated(true);
    }
  }, [session]);

  const setOccurrenceStatus = useCallback(
    async (occurrenceId: string, status: RideStatus) => {
      const { client } = requireSignedInClient();

      const { error: occurrenceError } = await client
        .from('trip_occurrences')
        .update({ status })
        .eq('id', occurrenceId);

      if (occurrenceError) {
        throw occurrenceError;
      }

      const { error: legsError } = await client
        .from('trip_legs')
        .update({ status })
        .eq('trip_occurrence_id', occurrenceId);

      if (legsError) {
        throw legsError;
      }

      await loadState();
    },
    [loadState, requireSignedInClient]
  );

  useEffect(() => {
    void loadState();
  }, [loadState]);

  const sortedViews = useMemo(() => getSortedViews(state), [state]);

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

          return `${ride.occurrence.serviceDate}T${ride.outboundLeg.pickupTime}:00` >= now.toISOString();
        });
      },
      getWeekMetrics: (weekStartIso) => getWeekMetrics(weekStartIso, sortedViews),
      createDraftForGroup: (groupId) =>
        createDraftFromView(sortedViews.find((ride) => ride.group.id === groupId)),
      addRide: async (draft) => {
        const { client, userId } = requireSignedInClient();
        const payload = buildInsertPayload(draft, userId);

        const { error: groupError } = await client.from('trip_groups').insert(payload.group);

        if (groupError) {
          throw groupError;
        }

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

        await loadState();
      },
      updateRide: async (groupId, draft) => {
        const { client, userId } = requireSignedInClient();
        const payload = buildInsertPayload(draft, userId, groupId);
        const { id: _groupId, ...groupUpdate } = payload.group;

        const { error: groupError } = await client
          .from('trip_groups')
          .update(groupUpdate)
          .eq('id', groupId);

        if (groupError) {
          throw groupError;
        }

        const { error: deleteOccurrencesError } = await client
          .from('trip_occurrences')
          .delete()
          .eq('trip_group_id', groupId);

        if (deleteOccurrencesError) {
          throw deleteOccurrencesError;
        }

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
      cancelSeries: async (groupId) => {
        const { client } = requireSignedInClient();
        const occurrenceIds = state.tripOccurrences
          .filter((occurrence) => occurrence.tripGroupId === groupId)
          .map((occurrence) => occurrence.id);

        const { error: occurrencesError } = await client
          .from('trip_occurrences')
          .update({ status: 'canceled' })
          .eq('trip_group_id', groupId);

        if (occurrencesError) {
          throw occurrencesError;
        }

        if (occurrenceIds.length > 0) {
          const { error: legsError } = await client
            .from('trip_legs')
            .update({ status: 'canceled' })
            .in('trip_occurrence_id', occurrenceIds);

          if (legsError) {
            throw legsError;
          }
        }

        await loadState();
      },
      updateProfile: async (profile) => {
        const { client, userId } = requireSignedInClient();

        const { error } = await client.from('profiles').upsert({
          id: userId,
          full_name: profile.name.trim() || null,
          phone: profile.phone.trim() || null,
        });

        if (error) {
          throw error;
        }

        setState((current) => ({ ...current, profile }));
      },
      updatePreferences: async (preferences) => {
        const { client, userId } = requireSignedInClient();

        const { error } = await client.from('driver_preferences').upsert({
          driver_id: userId,
          default_navigation_app: preferences.defaultNavigationApp,
          notifications_enabled: preferences.notificationsEnabled,
        });

        if (error) {
          throw error;
        }

        setState((current) => ({ ...current, preferences }));
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
