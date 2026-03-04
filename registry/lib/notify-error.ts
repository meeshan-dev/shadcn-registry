import { toast } from 'sonner';

export function notifyError(
  error: unknown,
  { id }: { id?: string | number } = {},
) {
  if (import.meta.env.DEV) {
    console.error(error);
  }

  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    toast.error(error.message, { id });
  } else if (error instanceof Error) {
    toast.error(error.message, { id });
  } else {
    toast.error('An unknown error occurred', { id });
  }
}
