export interface ExecutionStep<E> {
  readonly events: readonly E[];
  readonly explanation: string;
}

export interface ExecutionTrace<S, E> {
  readonly initialState: S;
  readonly steps: readonly ExecutionStep<E>[];
}

export interface ReversibleReducer<S, E, U> {
  apply(
    state: S,
    step: ExecutionStep<E>,
  ): { readonly state: S; readonly undo: U };
  revert(state: S, undo: U): S;
}
