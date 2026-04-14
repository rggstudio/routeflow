type PickerMode = 'date' | 'time';

export type DateTimePickerTimeConfig = {
  minuteInterval?: number;
  minimumTime?: string;
  maximumTime?: string;
};

export type DateTimePickerSheetProps = {
  visible: boolean;
  mode: PickerMode;
  title: string;
  value: Date;
  timeConfig?: DateTimePickerTimeConfig;
  onCancel: () => void;
  onConfirm: (value: Date) => void;
};

export declare function DateTimePickerSheet(props: DateTimePickerSheetProps): JSX.Element | null;
