type WatchFormValuesProps<T> = {
  watch: () => T;
  children: (value: T) => React.ReactNode;
};

export function WatchFormValues<T>({
  watch,
  children,
}: WatchFormValuesProps<T>) {
  const value = watch();

  return <>{children(value)}</>;
}
