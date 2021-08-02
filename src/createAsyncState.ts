import { AsyncState } from "./types"

export const createAsyncState = <TResult = any>(
  state: Partial<AsyncState<TResult>> = {}
): AsyncState<TResult> => {
  return {
    result: undefined,
    error: undefined,
    isRunning: false,
    isCancelled: false,
    ...state,
  }
}
