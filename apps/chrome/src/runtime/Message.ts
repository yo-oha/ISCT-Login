import { Response } from './Response'

export type Message = {
  function: 'OPEN_OPTIONS_PAGE'
}

export const sendMessage = async <M extends Message>(
  message: M,
): Promise<Response<M>> => chrome.runtime.sendMessage(message)
