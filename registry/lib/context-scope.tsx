import * as React from 'react';

export function createContextScope<ContextValue>(
  defaultValue: ContextValue | null = null,
) {
  const Context = React.createContext(defaultValue);

  /* ———————————————————— Scope Provider ———————————————————— */
  function ScopeProvider({
    value,
    children,
  }: {
    value: ContextValue;
    children: React.ReactNode;
  }) {
    return <Context value={value}>{children}</Context>;
  }

  /* ———————————————————— Use Scope Context ———————————————————— */

  type UseScopeCtxOptions = {
    /** Whether to throw an error if the context is not found
     * @default true
     */
    shouldThrow?: boolean;
  };

  /**
   * - it throws error when shouldThrow is true and context is missing
   * - it returns null when shouldThrow is false and context is missing
   */
  function useScopeCtx(props?: { shouldThrow?: true }): ContextValue;
  function useScopeCtx(props: { shouldThrow: false }): ContextValue | null;
  function useScopeCtx(props?: UseScopeCtxOptions) {
    const { shouldThrow = true } = props ?? {};

    const ctx = React.use(Context);

    if (!ctx && shouldThrow) {
      throw new Error('useScopeCtx must be used within ScopeProvider');
    }

    return ctx;
  }

  return [ScopeProvider, useScopeCtx] as const;
}
