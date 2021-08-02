import { Async } from "./Async"
import { createPromise, createTimeout } from "@corets/promise-helpers"
import { createAsyncState } from "./createAsyncState"

describe("Async", () => {
  it("creates a new async", () => {
    const async = new Async(() => "foo")

    expect(async).toBeDefined()
  })

  it("runs with a sync producer", async () => {
    const async = new Async(() => "foo")

    expect(async.getState()).toEqual(createAsyncState())

    const resultPromise = async.run()

    expect(resultPromise instanceof Promise).toBe(true)
    expect(async.getState()).toEqual(createAsyncState({ result: "foo" }))

    const result = await resultPromise

    expect(result).toBe("foo")
  })

  it("runs with a sync producer with args", async () => {
    const async = new Async((arg: number) => arg + 1)

    expect(async.getState()).toEqual(createAsyncState())

    const resultPromise = async.run(1)

    expect(resultPromise instanceof Promise).toBe(true)
    expect(async.getState()).toEqual(createAsyncState({ result: 2 }))

    const result = await resultPromise

    expect(result).toBe(2)
  })

  it("runs with an async producer", async () => {
    const async = new Async(async () => "foo")

    expect(async.getState()).toEqual(createAsyncState())

    const resultPromise = async.run()

    expect(resultPromise instanceof Promise).toBe(true)
    expect(async.getState()).toEqual(createAsyncState({ isRunning: true }))

    const result = await resultPromise

    expect(result).toBe("foo")
    expect(async.getState()).toEqual(createAsyncState({ result: "foo" }))
  })

  it("runs with an async producer with args", async () => {
    const async = new Async(async (arg: number) => arg + 1)

    expect(async.getState()).toEqual(createAsyncState())

    const resultPromise = async.run(1)

    expect(resultPromise instanceof Promise).toBe(true)
    expect(async.getState()).toEqual(createAsyncState({ isRunning: true }))

    const result = await resultPromise

    expect(result).toBe(2)
    expect(async.getState()).toEqual(createAsyncState({ result: 2 }))
  })

  it("resolves with a sync producer", async () => {
    const async = new Async(() => "foo")

    const resultPromise = async.resolve(() => "bar")

    expect(resultPromise instanceof Promise).toBe(true)
    expect(async.getState()).toEqual(createAsyncState({ result: "bar" }))

    const result = await resultPromise

    expect(result).toBe("bar")
  })

  it("resolves with an async producer", async () => {
    const async = new Async(() => "foo")

    const resultPromise = async.resolve(async () => "bar")

    expect(resultPromise instanceof Promise).toBe(true)
    expect(async.getState()).toEqual(createAsyncState({ isRunning: true }))

    const result = await resultPromise

    expect(result).toBe("bar")
    expect(async.getState()).toEqual(createAsyncState({ result: "bar" }))
  })

  it("resolves with a value", async () => {
    const async = new Async(() => "foo")

    const resultPromise = async.resolve("bar")

    expect(resultPromise instanceof Promise).toBe(true)
    expect(async.getState()).toEqual(createAsyncState({ result: "bar" }))

    const result = await resultPromise

    expect(result).toBe("bar")
  })

  it("resolves with a promise", async () => {
    const async = new Async(() => "foo")

    const resultPromise = async.resolve(Promise.resolve("bar"))

    expect(resultPromise instanceof Promise).toBe(true)
    expect(async.getState()).toEqual(createAsyncState({ isRunning: true }))

    const result = await resultPromise

    expect(result).toBe("bar")
    expect(async.getState()).toEqual(createAsyncState({ result: "bar" }))
  })

  it("re-throws sync errors from run", async () => {
    const error = new Error("Synthetic error")
    const async = new Async(() => {
      throw error
    })

    const resultPromise = async.run()

    expect(resultPromise).rejects.toEqual(error)
    expect(async.getState()).toEqual(createAsyncState({ error }))
  })

  it("re-throws async errors from run", async () => {
    const error = new Error("Synthetic error")
    const async = new Async(async () => {
      throw error
    })

    const resultPromise = async.run()

    expect(resultPromise).rejects.toEqual(error)

    await createTimeout(1)

    expect(async.getState()).toEqual(createAsyncState({ error }))
  })

  it("re-throws sync errors from resolve", async () => {
    const error = new Error("Synthetic error")
    const async = new Async(() => "foo")

    const resultPromise = async.resolve(() => {
      throw error
    })

    expect(resultPromise).rejects.toEqual(error)
    expect(async.getState()).toEqual(createAsyncState({ error }))
  })

  it("re-throws async errors from resolve", async () => {
    const error = new Error("Synthetic error")
    const async = new Async(() => "foo")

    const resultPromise = async.resolve(async () => {
      throw error
    })

    expect(resultPromise).rejects.toEqual(error)

    await createTimeout(1)

    expect(async.getState()).toEqual(createAsyncState({ error }))
  })

  it("cancels async operations", async () => {
    const async = new Async(() => "foo")

    const promise = createPromise()

    await async.run()

    expect(async.getState()).toEqual(createAsyncState({ result: "foo" }))

    const resultPromise = async.resolve(promise)

    expect(async.getState()).toEqual(
      createAsyncState({ result: "foo", isRunning: true })
    )

    async.cancel()

    expect(resultPromise).rejects.toEqual(new Error("Async has been cancelled"))

    expect(async.getState()).toEqual(
      createAsyncState({ result: "foo", isCancelled: true })
    )

    promise.resolve("bar")
    await createTimeout(1)

    expect(async.getState()).toEqual(
      createAsyncState({ result: "foo", isCancelled: true })
    )
  })

  it("ignores results from old ticks in wrong order", async () => {
    const async = new Async(() => "foo")

    await async.run()

    expect(async.getState()).toEqual(createAsyncState({ result: "foo" }))

    const promise1 = createPromise()
    const promise2 = createPromise()

    async.resolve(promise1)
    async.resolve(promise2)

    expect(async.getState()).toEqual(
      createAsyncState({ result: "foo", isRunning: true })
    )

    promise2.resolve("bar")

    await createTimeout(1)

    expect(async.getState()).toEqual(createAsyncState({ result: "bar" }))

    promise1.resolve("baz")

    await createTimeout(1)

    expect(async.getState()).toEqual(createAsyncState({ result: "bar" }))
  })

  it("ignores results from old ticks in right order", async () => {
    const async = new Async(() => "foo")

    await async.run()

    expect(async.getState()).toEqual(createAsyncState({ result: "foo" }))

    const promise1 = createPromise()
    const promise2 = createPromise()

    async.resolve(promise1)
    async.resolve(promise2)

    expect(async.getState()).toEqual(
      createAsyncState({ result: "foo", isRunning: true })
    )

    promise1.resolve("bar")

    await createTimeout(1)

    expect(async.getState()).toEqual(
      createAsyncState({ result: "foo", isRunning: true })
    )

    promise2.resolve("baz")

    await createTimeout(1)

    expect(async.getState()).toEqual(createAsyncState({ result: "baz" }))
  })

  it("listens to changes and unsubscribes", async () => {
    const async = new Async(async () => "foo")
    const listener = jest.fn()
    const unsubscribe = async.listen(listener, { immediate: true })

    expect(listener).toHaveBeenCalledTimes(1)
    expect(listener).toHaveBeenLastCalledWith(createAsyncState())

    const resultPromise = async.run()

    expect(listener).toHaveBeenCalledTimes(2)
    expect(listener).toHaveBeenLastCalledWith(
      createAsyncState({ isRunning: true })
    )

    await resultPromise

    expect(listener).toHaveBeenCalledTimes(3)
    expect(listener).toHaveBeenLastCalledWith(
      createAsyncState({ result: "foo" })
    )

    unsubscribe()

    await async.resolve("baz")

    expect(listener).toHaveBeenCalledTimes(3)
  })
})
