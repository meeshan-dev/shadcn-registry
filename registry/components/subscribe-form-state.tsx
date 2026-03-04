import {
  useFormState,
  type FieldValues,
  type UseFormStateProps,
  type UseFormStateReturn,
} from 'react-hook-form';

export function SubscribeFormState<
  TFieldValues extends FieldValues = FieldValues,
  TTransformedValues extends FieldValues = TFieldValues,
>({
  children,
  ...props
}: UseFormStateProps<TFieldValues, TTransformedValues> & {
  children: (state: UseFormStateReturn<TFieldValues>) => React.ReactNode;
}) {
  const state = useFormState<TFieldValues, TTransformedValues>(props);

  return <>{children(state)}</>;
}
