import { Message } from './Message'

type DataMapping = {
  OPEN_OPTIONS_PAGE: undefined
}

export type Response<M extends Message> =
  | {
      data: DataMapping[M['function']]
      error: null
    }
  | {
      data: null
      error: Error
    }
