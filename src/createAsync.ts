import { CreateAsync } from "./types"
import { Async } from "./Async"

export const createAsync: CreateAsync = (producer) => new Async(producer)
