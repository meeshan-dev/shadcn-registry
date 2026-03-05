import type React from 'react';

export function mergeRefs<T extends HTMLElement>(
  ...refs: (
    | React.RefObject<T | null>
    | ((element: T | null) => void)
    | null
    | undefined
  )[]
) {
  return (element: T | null) => {
    for (const ref of refs) {
      if (typeof ref === 'function') {
        ref(element);
      } else if (ref) {
        ref.current = element;
      }
    }
  };
}
