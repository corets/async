import { createAsync } from "./createAsync"
import { Async } from "./Async"

describe("createAsync", () => {
  it("create async", async () => {
    const async = createAsync((arg: number) => arg + 1)

    expect(async instanceof Async).toBe(true)
    expect(async.getResult()).toBe(undefined)

    await async.run(1)

    expect(async.getResult()).toBe(2)
  })
})
