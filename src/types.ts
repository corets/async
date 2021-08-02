import {
  ValueListener,
  ValueListenerUnsubscribe,
  ValueListenOptions,
} from "@corets/value"

export type AsyncProducer<TResult, TArgs extends any[]> = (
  ...args: TArgs
) => Promise<TResult> | TResult

export type AsyncProducerWithoutArgs<TResult> = () => Promise<TResult> | TResult

export type AsyncProducerWithoutArgsOrResult<TResult> =
  | AsyncProducerWithoutArgs<TResult>
  | Promise<TResult>
  | TResult

export type CreateAsync = <TResult, TArgs extends any[]>(
  producer: AsyncProducer<TResult, TArgs>
) => ObservableAsync<TResult, TArgs>

export type AsyncState<TResult> = {
  error: any | undefined
  result: TResult | undefined
  isRunning: boolean
  isCancelled: boolean
}

export interface ObservableAsync<TResult, TArgs extends any[] = []> {
  getResult(): TResult | undefined
  getError(): any
  getState(): AsyncState<TResult>
  isRunning(): boolean
  isErrored(): boolean
  isCancelled(): boolean

  run(...args: TArgs): Promise<TResult>
  resolve(
    producerOrResult: AsyncProducerWithoutArgsOrResult<TResult>
  ): Promise<TResult>

  cancel(): void

  listen(
    listener: ValueListener<AsyncState<TResult>>,
    options?: ValueListenOptions<AsyncState<TResult>>
  ): ValueListenerUnsubscribe
}
