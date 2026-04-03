type PickerMode = 'date' | 'time';

export type DateTimePickerSheetProps = {
  visible: boolean;
  mode: PickerMode;
  title: string;
  value: Date;
  onCancel: () => void;
  onConfirm: (value: Date) => void;
};

export declare function DateTimePickerSheet(props: DateTimePickerSheetProps): JSX.Element | null;
