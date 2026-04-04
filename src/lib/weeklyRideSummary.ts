import { compareTime } from '@/lib/date';
import { RideOccurrenceView, RideStatus } from '@/types/ride';

export type WeeklyRideSummary = {
  key: string;
  riderName: string;
  serviceDate: string;
  status: RideStatus;
  totalAmount: number;
  legTimes: string[];
  rideCount: number;
};

function isCanceledStatus(status: RideStatus) {
  return status === 'canceled' || status === 'canceled_paid';
}

function getSummaryStatus(statuses: RideStatus[]): RideStatus {
  if (statuses.some((status) => status === 'in_progress')) {
    return 'in_progress';
  }

  if (statuses.every((status) => status === 'completed')) {
    return 'completed';
  }

  if (statuses.every((status) => isCanceledStatus(status))) {
    return statuses.some((status) => status === 'canceled_paid') ? 'canceled_paid' : 'canceled';
  }

  if (statuses.some((status) => status === 'completed')) {
    return 'in_progress';
  }

  return 'scheduled';
}

export function summarizeWeeklyRides(rides: RideOccurrenceView[]): WeeklyRideSummary[] {
  const summaries = new Map<string, WeeklyRideSummary>();

  for (const ride of rides) {
    const key =
      ride.group.tripType === 'round_trip'
        ? `${ride.group.id}:${ride.occurrence.serviceDate}`
        : ride.occurrence.id;
    const current = summaries.get(key);

    if (!current) {
      summaries.set(key, {
        key,
        riderName: ride.group.riderName,
        serviceDate: ride.occurrence.serviceDate,
        status: ride.occurrence.status,
        totalAmount: ride.occurrence.status === 'canceled' ? 0 : ride.effectivePay,
        legTimes: [ride.activeLeg.pickupTime],
        rideCount: 1,
      });
      continue;
    }

    const nextTimes = [...current.legTimes, ride.activeLeg.pickupTime].sort(compareTime);
    const statuses = [current.status, ride.occurrence.status];

    summaries.set(key, {
      ...current,
      status: getSummaryStatus(statuses),
      totalAmount:
        current.totalAmount + (ride.occurrence.status === 'canceled' ? 0 : ride.effectivePay),
      legTimes: nextTimes,
      rideCount: current.rideCount + 1,
    });
  }

  return [...summaries.values()].sort((a, b) => {
    if (a.serviceDate === b.serviceDate) {
      return compareTime(a.legTimes[0] ?? '00:00', b.legTimes[0] ?? '00:00');
    }

    return a.serviceDate.localeCompare(b.serviceDate);
  });
}
