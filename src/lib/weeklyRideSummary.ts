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

type WeeklyRideSummaryDraft = {
  key: string;
  riderName: string;
  serviceDate: string;
  rides: RideOccurrenceView[];
};

function isCanceledStatus(status: RideStatus) {
  return status === 'canceled' || status === 'canceled_paid';
}

function isUnpaidCanceledStatus(status: RideStatus) {
  return status === 'canceled';
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

function getSummarizedRides(rides: RideOccurrenceView[]) {
  const activeRides = rides.filter((ride) => !isCanceledStatus(ride.occurrence.status));

  return activeRides.length > 0 ? activeRides : rides;
}

export function summarizeWeeklyRides(rides: RideOccurrenceView[]): WeeklyRideSummary[] {
  const summaries = new Map<string, WeeklyRideSummaryDraft>();

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
        rides: [ride],
      });
      continue;
    }

    summaries.set(key, {
      ...current,
      rides: [...current.rides, ride],
    });
  }

  return [...summaries.values()].map((summary) => {
    const summarizedRides = getSummarizedRides(summary.rides);
    const legTimes = summarizedRides
      .map((ride) => ride.activeLeg.pickupTime)
      .sort(compareTime);
    const statuses = summarizedRides.map((ride) => ride.occurrence.status);
    const totalAmount = summary.rides.reduce(
      (sum, ride) =>
        sum + (isUnpaidCanceledStatus(ride.occurrence.status) ? 0 : ride.effectivePay),
      0
    );

    return {
      key: summary.key,
      riderName: summary.riderName,
      serviceDate: summary.serviceDate,
      status: getSummaryStatus(statuses),
      totalAmount,
      legTimes,
      rideCount: summarizedRides.length,
    };
  }).sort((a, b) => {
    if (a.serviceDate === b.serviceDate) {
      return compareTime(a.legTimes[0] ?? '00:00', b.legTimes[0] ?? '00:00');
    }

    return a.serviceDate.localeCompare(b.serviceDate);
  });
}
