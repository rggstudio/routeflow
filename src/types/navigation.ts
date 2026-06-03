export type RootStackParamList = {
  Splash: undefined;
  Auth: { mode?: 'sign_in' | 'sign_up' } | undefined;
  Dashboard: undefined;
  AdminDashboard: undefined;
  RideDetail: { occurrenceId: string };
  TripNavigation: { tripId: string; stopId?: string; riderId?: string };
  RideForm: { groupId?: string } | undefined;
  WeeklyReport: { weekStart: string };
  Home: undefined;
  Backend: undefined;
  Account: undefined;
};
