import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';

import { ActionButton, Screen, SectionCard, StatTile } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { todayIso } from '@/lib/date';
import { useRouteFlow } from '@/providers/RouteFlowProvider';

type AdminDriverStatsRow = {
  active_riders: number | string | null;
  canceled_rides_week: number | string | null;
  completed_rides_week: number | string | null;
  created_at: string;
  driver_id: string;
  dropoffs_week: number | string | null;
  email: string | null;
  full_name: string | null;
  is_admin: boolean;
  last_activity_at: string | null;
  next_pickup_at: string | null;
  rides_today: number | string | null;
  total_trip_groups: number | string | null;
  upcoming_rides: number | string | null;
};

function toCount(value: number | string | null | undefined) {
  return Number(value ?? 0);
}

function formatShortDateTime(value: string | null) {
  if (!value) {
    return 'No activity yet';
  }

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

function getDriverLabel(row: AdminDriverStatsRow) {
  return row.full_name?.trim() || row.email || 'Driver';
}

export function AdminDashboardScreen() {
  const { state } = useRouteFlow();
  const [rows, setRows] = useState<AdminDriverStatsRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadStats = useCallback(async (isManualRefresh = false) => {
    if (!supabase) {
      setErrorMessage('Supabase is not configured.');
      setRows([]);
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const { data, error } = await supabase.rpc('admin_driver_stats', {
        report_date: todayIso(),
      });

      if (error) {
        throw error;
      }

      setRows((data ?? []) as AdminDriverStatsRow[]);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load admin stats.');
      setRows([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  const totals = useMemo(() => {
    return rows.reduce(
      (summary, row) => ({
        drivers: summary.drivers + 1,
        activeRiders: summary.activeRiders + toCount(row.active_riders),
        ridesToday: summary.ridesToday + toCount(row.rides_today),
        completedWeek: summary.completedWeek + toCount(row.completed_rides_week),
        canceledWeek: summary.canceledWeek + toCount(row.canceled_rides_week),
        dropoffsWeek: summary.dropoffsWeek + toCount(row.dropoffs_week),
        upcoming: summary.upcoming + toCount(row.upcoming_rides),
      }),
      {
        drivers: 0,
        activeRiders: 0,
        ridesToday: 0,
        completedWeek: 0,
        canceledWeek: 0,
        dropoffsWeek: 0,
        upcoming: 0,
      }
    );
  }, [rows]);

  if (!state.profile.isAdmin) {
    return (
      <Screen avatarPlacement="none">
        <SectionCard eyebrow="Owner tools" title="Admin access only">
          <Text className="text-sm leading-6 text-slate-300">
            This dashboard is only available to the RouteFlow owner account.
          </Text>
        </SectionCard>
      </Screen>
    );
  }

  return (
    <Screen avatarPlacement="none" scroll={false}>
      <ScrollView
        refreshControl={
          <RefreshControl
            tintColor="#67e8f9"
            refreshing={isRefreshing}
            onRefresh={() => {
              void loadStats(true);
            }}
          />
        }
        contentContainerStyle={{ paddingBottom: 28 }}
      >
        <View className="mb-6">
          <Text className="text-[11px] font-semibold uppercase tracking-[2px] text-cyan-300">
            Owner analytics
          </Text>
          <Text className="mt-2 text-3xl font-semibold text-white">Driver activity</Text>
          <Text className="mt-3 text-sm leading-6 text-slate-400">
            This pulls live backend stats grouped by driver so you can see who is using RouteFlow
            and how much activity they are creating.
          </Text>
        </View>

        <SectionCard title="Overview">
          <View className="flex-row flex-wrap gap-3">
            <StatTile label="Drivers" value={String(totals.drivers)} />
            <StatTile label="Riders" value={String(totals.activeRiders)} />
            <StatTile label="Rides today" value={String(totals.ridesToday)} tone="positive" />
            <StatTile label="Upcoming" value={String(totals.upcoming)} />
            <StatTile label="Completed week" value={String(totals.completedWeek)} tone="positive" />
            <StatTile label="Canceled week" value={String(totals.canceledWeek)} tone="negative" />
            <StatTile label="Dropoffs week" value={String(totals.dropoffsWeek)} tone="warning" />
          </View>
        </SectionCard>

        <SectionCard title="Driver breakdown">
          {isLoading ? (
            <Text className="text-sm leading-6 text-slate-400">Loading admin stats...</Text>
          ) : errorMessage ? (
            <View className="gap-4">
              <Text className="text-sm leading-6 text-rose-200">{errorMessage}</Text>
              <ActionButton label="Try again" kind="primary" onPress={() => void loadStats()} />
            </View>
          ) : rows.length === 0 ? (
            <Text className="text-sm leading-6 text-slate-400">
              No driver data is available yet.
            </Text>
          ) : (
            <View className="gap-4">
              {rows.map((row) => (
                <View
                  key={row.driver_id}
                  className="rounded-[28px] border border-white/10 bg-white/5 px-4 py-4"
                >
                  <View className="flex-row items-start justify-between gap-3">
                    <View className="flex-1">
                      <Text className="text-lg font-semibold text-white">
                        {getDriverLabel(row)}
                      </Text>
                      <Text className="mt-1 text-sm text-slate-400">
                        {row.email ?? 'No email available'}
                      </Text>
                    </View>
                    {row.is_admin ? (
                      <View className="rounded-full border border-cyan-300/40 bg-cyan-400/10 px-3 py-1">
                        <Text className="text-[11px] font-semibold uppercase tracking-[1.5px] text-cyan-200">
                          Admin
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  <View className="mt-4 flex-row flex-wrap gap-3">
                    <StatTile label="Rides today" value={String(toCount(row.rides_today))} />
                    <StatTile label="Upcoming" value={String(toCount(row.upcoming_rides))} />
                    <StatTile label="Riders" value={String(toCount(row.active_riders))} />
                    <StatTile
                      label="Completed week"
                      value={String(toCount(row.completed_rides_week))}
                      tone="positive"
                    />
                    <StatTile
                      label="Canceled week"
                      value={String(toCount(row.canceled_rides_week))}
                      tone="negative"
                    />
                    <StatTile
                      label="Dropoffs week"
                      value={String(toCount(row.dropoffs_week))}
                      tone="warning"
                    />
                  </View>

                  <View className="mt-4 gap-1">
                    <Text className="text-sm text-slate-300">
                      Trip groups: {toCount(row.total_trip_groups)}
                    </Text>
                    <Text className="text-sm text-slate-300">
                      Next pickup: {formatShortDateTime(row.next_pickup_at)}
                    </Text>
                    <Text className="text-sm text-slate-300">
                      Last activity: {formatShortDateTime(row.last_activity_at)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </SectionCard>
      </ScrollView>
    </Screen>
  );
}
