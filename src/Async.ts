import {
  createValue,
  ObservableValue,
  ValueListener,
  ValueListenerUnsubscribe,
  ValueListenOptions,
} from "@corets/value"
import { createAsyncState } from "./createAsyncState"
import {
  AsyncProducer,
  AsyncProducerWithoutArgs,
  AsyncProducerWithoutArgsOrResult,
  AsyncState,
  ObservableAsync,
} from "./types"

export class Async<TResult, TArgs extends any[]>
  implements ObservableAsync<TResult, TArgs> {
  producer: AsyncProducer<TResult, TArgs>
  state: ObservableValue<AsyncState<TResult>>
  currentTick: number = 0

  constructor(producer: AsyncProducer<TResult, TArgs>) {
    this.state = createValue<AsyncState<TResult>>(createAsyncState())
    this.producer = producer
  }

  getError(): any {
    return this.state.get().error
  }

  getResult(): TResult | undefined {
    return this.state.get().result
  }

  getState(): AsyncState<TResult> {
    return this.state.get()
  }

  isRunning(): boolean {
    return this.state.get().isRunning
  }

  isCancelled(): boolean {
    return this.state.get().isCancelled
  }

  isErrored(): boolean {
    return !!this.state.get().error
  }

  async run(...args: TArgs): Promise<TResult> {
    return this.invoke(() => this.producer(...args))
  }

  async resolve(
    producerOrResult: AsyncProducerWithoutArgsOrResult<TResult>
  ): Promise<TResult> {
    const producer =
      typeof producerOrResult === "function"
        ? producerOrResult
        : () => producerOrResult

    return this.invoke(producer as AsyncProducerWithoutArgs<TResult>)
  }

  protected async invoke(
    producer: AsyncProducerWithoutArgs<TResult>
  ): Promise<TResult> {
    return new Promise(async (resolve, reject) => {
      try {
        const tick = this.nextTick()

        const resultOrPromise = producer()

        if (resultOrPromise instanceof Promise) {
          this.state.set(
            createAsyncState({
              result: this.getResult(),
              isRunning: true,
            })
          )
        }

        const result =
          resultOrPromise instanceof Promise
            ? await resultOrPromise
            : resultOrPromise

        if (!this.isSameTick(tick)) {
          return resolve(result)
        }

        if (this.isCancelled()) {
          return reject(new Error("Async has been cancelled"))
        }

        this.state.set(
          createAsyncState({
            result: result,
          })
        )

        return resolve(result)
      } catch (err) {
        this.state.set(
          createAsyncState({
            result: this.getResult(),
            error: err,
          })
        )

        reject(err)
      }
    })
  }

  cancel(): void {
    this.state.set(
      createAsyncState({
        result: this.getResult(),
        isCancelled: true,
      })
    )
  }

  listen(
    listener: ValueListener<AsyncState<TResult>>,
    options?: ValueListenOptions<AsyncState<TResult>>
  ): ValueListenerUnsubscribe {
    return this.state.listen(listener, options)
  }

  private nextTick(): number {
    this.currentTick++

    return this.currentTick
  }

  private isSameTick(tick: number): boolean {
    return tick === this.currentTick
  }
}
