import { useMemo, useRef, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';

import { BottomSheetScreen } from '@/components/BottomSheetScreen';
import { ActionButton, PillButton, SectionCard } from '@/components/ui';
import { getFullDateLabel, getWeekRangeLabel } from '@/lib/date';
import { shareReport } from '@/lib/routeFlow';
import { useRouteFlow } from '@/providers/RouteFlowProvider';
import { RootStackParamList } from '@/types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'WeeklyReport'>;
type WeekMetrics = ReturnType<ReturnType<typeof useRouteFlow>['getWeekMetrics']>;

type BackgroundOption = {
  id: string;
  name: string;
  background: string;
  accent: string;
  cardSurface: string;
  text: string;
  subtext: string;
  avatar: string;
  avatarText: string;
  orbOne: string;
  orbTwo: string;
};

const BACKGROUND_OPTIONS: BackgroundOption[] = [
  {
    id: 'glacier',
    name: 'Glacier',
    background: '#082f49',
    accent: '#67e8f9',
    cardSurface: 'rgba(8, 47, 73, 0.6)',
    text: '#f8fafc',
    subtext: '#cbd5e1',
    avatar: 'rgba(103, 232, 249, 0.18)',
    avatarText: '#cffafe',
    orbOne: 'rgba(34, 211, 238, 0.34)',
    orbTwo: 'rgba(14, 165, 233, 0.28)',
  },
  {
    id: 'sunset',
    name: 'Sunset',
    background: '#431407',
    accent: '#fdba74',
    cardSurface: 'rgba(67, 20, 7, 0.6)',
    text: '#fff7ed',
    subtext: '#fed7aa',
    avatar: 'rgba(251, 146, 60, 0.18)',
    avatarText: '#ffedd5',
    orbOne: 'rgba(249, 115, 22, 0.32)',
    orbTwo: 'rgba(245, 158, 11, 0.24)',
  },
  {
    id: 'orchard',
    name: 'Orchard',
    background: '#052e16',
    accent: '#86efac',
    cardSurface: 'rgba(5, 46, 22, 0.64)',
    text: '#f0fdf4',
    subtext: '#bbf7d0',
    avatar: 'rgba(74, 222, 128, 0.16)',
    avatarText: '#dcfce7',
    orbOne: 'rgba(34, 197, 94, 0.26)',
    orbTwo: 'rgba(132, 204, 22, 0.22)',
  },
  {
    id: 'violet-night',
    name: 'Violet Night',
    background: '#312e81',
    accent: '#c4b5fd',
    cardSurface: 'rgba(49, 46, 129, 0.58)',
    text: '#eef2ff',
    subtext: '#c7d2fe',
    avatar: 'rgba(167, 139, 250, 0.18)',
    avatarText: '#ede9fe',
    orbOne: 'rgba(129, 140, 248, 0.32)',
    orbTwo: 'rgba(192, 132, 252, 0.24)',
  },
];

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return 'RF';
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function getMonthDayCode(isoDate: string) {
  const [, month, day] = isoDate.split('-');
  return `${month}-${day}`;
}

function buildReportText(
  name: string,
  weekStart: string,
  metrics: WeekMetrics
) {
  const lines = [
    `RouteFlow Weekly Report for Driver: ${name}`,
    `Week: ${getWeekRangeLabel(weekStart)}`,
    `Total Earnings: $${metrics.totalEarnings.toFixed(2)}`,
    `Total Rides: ${metrics.totalRides}`,
    '',
    'Breakdown of rides:',
    ...metrics.rides.map(
      (ride) =>
        `${getMonthDayCode(ride.occurrence.serviceDate)} | ${ride.group.riderName} | $${ride.effectivePay.toFixed(2)}`
    ),
  ];

  return lines.join('\n');
}

export function WeeklyReportScreen({ navigation, route }: Props) {
  const { state, getWeekMetrics } = useRouteFlow();
  const metrics = getWeekMetrics(route.params.weekStart);
  const reportCardRef = useRef<View>(null);
  const [selectedBackgroundId, setSelectedBackgroundId] = useState(
    () => BACKGROUND_OPTIONS[Math.floor(Math.random() * BACKGROUND_OPTIONS.length)]?.id ?? 'glacier'
  );
  const [isSharingImage, setIsSharingImage] = useState(false);
  const reportText = buildReportText(state.profile.name, route.params.weekStart, metrics);
  const driverName = state.profile.name.trim() || 'RouteFlow Driver';
  const selectedBackground =
    BACKGROUND_OPTIONS.find((option) => option.id === selectedBackgroundId) ?? BACKGROUND_OPTIONS[0];
  const avatarInitials = useMemo(() => getInitials(driverName), [driverName]);

  const handleShareImage = async () => {
    if (!reportCardRef.current) {
      return;
    }

    try {
      setIsSharingImage(true);
      const uri = await captureRef(reportCardRef, {
        format: 'png',
        quality: 1,
      });
      const sharingAvailable = await Sharing.isAvailableAsync();

      if (sharingAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Share weekly report image',
        });
      } else {
        await shareReport(`${reportText}\n\nImage saved at: ${uri}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to build the share image.';
      Alert.alert('Share image unavailable', message);
    } finally {
      setIsSharingImage(false);
    }
  };

  return (
    <BottomSheetScreen onClose={() => navigation.goBack()}>
      <ScrollView contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        <View className="mb-6">
          <Text className="text-[11px] font-semibold uppercase tracking-[2px] text-cyan-300">
            Weekly report
          </Text>
          <Text className="mt-2 text-4xl font-semibold text-white">Share-ready summary</Text>
          <Text className="mt-3 text-base leading-7 text-slate-300">
            Build a styled weekly recap image, swap the background, then share it in one tap.
          </Text>
        </View>

        <SectionCard title={driverName} eyebrow={getWeekRangeLabel(route.params.weekStart)}>
          <View className="mb-4 flex-row items-end justify-between">
            <View>
              <Text className="text-sm uppercase tracking-[1.5px] text-slate-400">
                Total earnings
              </Text>
              <Text className="mt-2 text-4xl font-semibold text-white">
                ${metrics.totalEarnings.toFixed(2)}
              </Text>
            </View>
            <View>
              <Text className="text-sm uppercase tracking-[1.5px] text-slate-400">Total rides</Text>
              <Text className="mt-2 text-right text-3xl font-semibold text-cyan-200">
                {metrics.totalRides}
              </Text>
            </View>
          </View>

          {metrics.rides.length > 0 ? (
            metrics.rides.map((ride) => (
              <View
                key={ride.occurrence.id}
                className="mb-3 flex-row items-center justify-between rounded-3xl bg-white/5 px-4 py-4"
              >
                <View className="flex-1 pr-4">
                  <Text className="font-semibold text-white">{ride.group.riderName}</Text>
                  <Text className="mt-1 text-sm text-slate-400">
                    {getFullDateLabel(ride.occurrence.serviceDate)}
                  </Text>
                </View>
                <Text className="text-base font-semibold text-cyan-200">
                  ${ride.effectivePay.toFixed(2)}
                </Text>
              </View>
            ))
          ) : (
            <Text className="text-sm leading-6 text-slate-300">
              No rides were logged in this week, so the share image will show a clean empty-state summary.
            </Text>
          )}
        </SectionCard>

        <SectionCard title="Share image background" eyebrow="Pick the look">
          <View className="mb-4 flex-row flex-wrap gap-2">
            {BACKGROUND_OPTIONS.map((option) => (
              <PillButton
                key={option.id}
                label={option.name}
                selected={option.id === selectedBackground.id}
                onPress={() => setSelectedBackgroundId(option.id)}
              />
            ))}
          </View>
          <ActionButton
            label="Shuffle background"
            icon="shuffle-outline"
            onPress={() => {
              const alternatives = BACKGROUND_OPTIONS.filter(
                (option) => option.id !== selectedBackground.id
              );
              const next =
                alternatives[Math.floor(Math.random() * alternatives.length)] ?? selectedBackground;
              setSelectedBackgroundId(next.id);
            }}
          />
        </SectionCard>

        <SectionCard title="Image preview" eyebrow="What gets shared">
          <View className="items-center">
            <View
              ref={reportCardRef}
              collapsable={false}
              style={{
                width: 332,
                overflow: 'hidden',
                borderRadius: 32,
                backgroundColor: selectedBackground.background,
                padding: 22,
              }}
            >
              <View
                style={{
                  position: 'absolute',
                  right: -36,
                  top: -28,
                  height: 160,
                  width: 160,
                  borderRadius: 999,
                  backgroundColor: selectedBackground.orbOne,
                }}
              />
              <View
                style={{
                  position: 'absolute',
                  bottom: -44,
                  left: -24,
                  height: 140,
                  width: 140,
                  borderRadius: 999,
                  backgroundColor: selectedBackground.orbTwo,
                }}
              />
              <View
                style={{
                  borderRadius: 28,
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.12)',
                  backgroundColor: selectedBackground.cardSurface,
                  padding: 18,
                }}
              >
                <View
                  style={{
                    marginBottom: 18,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <View style={{ flex: 1, paddingRight: 12 }}>
                    <Text
                      style={{
                        color: selectedBackground.accent,
                        fontSize: 11,
                        fontWeight: '700',
                        letterSpacing: 1.8,
                        textTransform: 'uppercase',
                      }}
                    >
                      Weekly share card
                    </Text>
                    <Text
                      style={{
                        marginTop: 10,
                        color: selectedBackground.text,
                        fontSize: 24,
                        fontWeight: '700',
                        lineHeight: 31,
                      }}
                    >
                      RouteFlow Weekly Report for Driver: {driverName}
                    </Text>
                  </View>
                  <View
                    style={{
                      height: 62,
                      width: 62,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 22,
                      backgroundColor: selectedBackground.avatar,
                    }}
                  >
                    <Text
                      style={{
                        color: selectedBackground.avatarText,
                        fontSize: 22,
                        fontWeight: '700',
                      }}
                    >
                      {avatarInitials}
                    </Text>
                  </View>
                </View>

                <View
                  style={{
                    marginBottom: 16,
                    borderRadius: 22,
                    backgroundColor: 'rgba(255,255,255,0.06)',
                    padding: 14,
                  }}
                >
                  <Text
                    style={{
                      color: selectedBackground.subtext,
                      fontSize: 12,
                      marginBottom: 6,
                    }}
                  >
                    Week: {getWeekRangeLabel(route.params.weekStart)}
                  </Text>
                  <Text
                    style={{
                      color: selectedBackground.text,
                      fontSize: 18,
                      fontWeight: '700',
                    }}
                  >
                    Total Earnings: ${metrics.totalEarnings.toFixed(2)}
                  </Text>
                  <Text
                    style={{
                      color: selectedBackground.text,
                      fontSize: 16,
                      fontWeight: '600',
                      marginTop: 4,
                    }}
                  >
                    Total Rides: {metrics.totalRides}
                  </Text>
                </View>

                <Text
                  style={{
                    color: selectedBackground.text,
                    fontSize: 15,
                    fontWeight: '700',
                    marginBottom: 10,
                  }}
                >
                  Breakdown of rides:
                </Text>

                {metrics.rides.length > 0 ? (
                  metrics.rides.map((ride) => (
                    <View
                      key={ride.occurrence.id}
                      style={{
                        marginBottom: 8,
                        borderRadius: 18,
                        backgroundColor: 'rgba(255,255,255,0.06)',
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                      }}
                    >
                      <Text
                        style={{
                          color: selectedBackground.text,
                          fontSize: 12,
                          fontWeight: '600',
                          lineHeight: 18,
                        }}
                      >
                        {getMonthDayCode(ride.occurrence.serviceDate)} | {ride.group.riderName} | $
                        {ride.effectivePay.toFixed(2)}
                      </Text>
                    </View>
                  ))
                ) : (
                  <View
                    style={{
                      borderRadius: 18,
                      backgroundColor: 'rgba(255,255,255,0.06)',
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                    }}
                  >
                    <Text
                      style={{
                        color: selectedBackground.subtext,
                        fontSize: 12,
                        lineHeight: 18,
                      }}
                    >
                      No rides recorded for this week.
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </SectionCard>

        <View className="gap-3">
          <ActionButton
            label={isSharingImage ? 'Preparing image...' : 'Share as image'}
            kind="primary"
            icon="image-outline"
            onPress={handleShareImage}
          />
          <ActionButton
            label="Share as text"
            kind="secondary"
            onPress={() => shareReport(reportText)}
          />
          <SectionCard title="Export options">
            <Text className="text-sm leading-6 text-slate-300">
              The image export captures the styled card with your selected background, avatar initials,
              totals, and ride-by-ride weekly breakdown.
            </Text>
          </SectionCard>
        </View>
      </ScrollView>
    </BottomSheetScreen>
  );
}
