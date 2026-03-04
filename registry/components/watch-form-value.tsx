type WatchFormValueProps<T> = {
  watch: () => T;
  children: (value: T) => React.ReactNode;
};

export function WatchFormValue<T>({ watch, children }: WatchFormValueProps<T>) {
  const value = watch();

  return <>{children(value)}</>;
}
