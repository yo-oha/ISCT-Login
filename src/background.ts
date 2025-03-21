import { Response } from './runtime/Response'
import { Message } from './runtime/Message'

chrome.runtime.onMessage.addListener(
  <M extends Message>(
    message: M,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: Response<M>) => any,
  ) => {
    switch (message.function) {
      case 'OPEN_OPTIONS_PAGE':
        chrome.runtime.openOptionsPage()
        return
    }
  },
)
