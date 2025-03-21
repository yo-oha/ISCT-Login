import { Secret, TOTP } from 'otpauth'
import React, { Reducer, useEffect, useState } from 'react'
import { AsyncActionHandlers, useReducerAsync } from 'use-reducer-async'
import { useTranslation } from 'react-i18next'
import { Account, accountBucket } from '../storage/Accout'
import { parse } from 'node-html-parser'
import toast, { Toaster } from 'react-hot-toast'
import { sendMessage } from '../runtime/Message'

const ROOT_URL = 'https://isct.ex-tic.com'
const LOGIN_URL = `${ROOT_URL}/auth/session`
const LOGIN_SECOND_URL = `${LOGIN_URL}/second_factor`

const URL_REGEX =
  /https?:\/\/[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/

type State = ToastState | null

type ToastState = {
  message: ToastMessageState
  status: 'loading' | 'error'
  showOpenOptions?: boolean
}

type ToastMessageState =
  | 'AUTHENTICATING_ACCOUNT'
  | 'AUTHENTICATING_OTP'
  | `ERROR_${ErrorState}`

type ErrorState =
  | 'ACCOUNT_NOT_SET'
  | 'LOAD_FAILURE'
  | 'INVALID_STATUS_CODE'
  | 'INVALID_FORMAT'
  | 'AUTHENTICATE_FAILURE'

const initialState: State = null

type InnerAction =
  | { type: 'ERROR_LOAD'; error: ErrorState }
  | { type: 'START_AUTHENTICATE' }
  | { type: 'UPDATE_AUTHENTICATE' }
  | { type: 'FINISH_AUTHENTICATE'; url: string }
  | { type: 'ERROR_AUTHENTICATE'; error: ErrorState }

type OuterAction = { type: 'OPEN_OPTIONS' }

type Action = InnerAction | OuterAction

const reducer: Reducer<State, Action> = (state: State, action: Action) => {
  switch (action.type) {
    case 'ERROR_LOAD':
      return {
        message: `ERROR_${action.error}`,
        status: 'error',
      }
    case 'START_AUTHENTICATE':
      return {
        message: 'AUTHENTICATING_ACCOUNT',
        status: 'loading',
      }
    case 'UPDATE_AUTHENTICATE':
      return {
        message: 'AUTHENTICATING_OTP',
        status: 'loading',
      }
    case 'FINISH_AUTHENTICATE':
      window.location.href = action.url
      return null
    case 'ERROR_AUTHENTICATE':
      return {
        message: `ERROR_${action.error}`,
        status: 'error',
        showOpenOptions: true,
      }
    case 'OPEN_OPTIONS':
      sendMessage({ function: 'OPEN_OPTIONS_PAGE' })
      return state
  }
}

type AsyncAction = { type: 'AUTHENTICATE' }

const getAccount = async (): Promise<
  | {
      account: Account
      error: undefined
    }
  | {
      account: undefined
      error: ErrorState
    }
> => {
  try {
    const account = await accountBucket.get()
    if (!account.id || !account.password || !account.otpSecret) {
      return { account: undefined, error: 'ACCOUNT_NOT_SET' }
    }
    return {
      account,
      error: undefined,
    }
  } catch {
    return {
      account: undefined,
      error: 'LOAD_FAILURE',
    }
  }
}

const asyncActionHandlers: AsyncActionHandlers<
  Reducer<State, Action>,
  AsyncAction
> = {
  AUTHENTICATE:
    ({ dispatch }) =>
    async () => {
      const { account, error } = await getAccount()
      if (error) {
        dispatch({ type: 'ERROR_LOAD', error })
        return
      }
      dispatch({ type: 'START_AUTHENTICATE' })
      try {
        // Accound, Passwordの認証
        const firstCsrfToken =
          document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
            ?.content ?? ''
        const firstForm = new FormData()
        firstForm.append('utf8', '✓')
        firstForm.append('authenticity_token', firstCsrfToken)
        firstForm.append('identifier', account.id)
        firstForm.append('password', account.password)
        const firstResponse = await fetch(LOGIN_URL, {
          method: 'POST',
          body: firstForm,
        })
        if (!firstResponse.ok) {
          dispatch({
            type: 'ERROR_AUTHENTICATE',
            error: 'INVALID_STATUS_CODE',
          })
          return
        }

        dispatch({ type: 'UPDATE_AUTHENTICATE' })

        // OTPの認証
        const secondResponse =
          firstResponse.url === LOGIN_SECOND_URL
            ? firstResponse
            : await fetch(LOGIN_SECOND_URL, {
                method: 'GET',
                credentials: 'include',
              })
        const secondRoot = parse(await secondResponse.text())
        const secondCsrfToken =
          secondRoot
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute('content') ?? ''
        const totpToken = TOTP.generate({
          secret: Secret.fromBase32(account.otpSecret),
        })
        const secondForm = new FormData()
        secondForm.append('utf8', '✓')
        secondForm.append('authenticity_token', secondCsrfToken)
        secondForm.append('totp', totpToken)
        const response = await fetch(LOGIN_SECOND_URL, {
          method: 'POST',
          body: secondForm,
          headers: {
            // これ以降のリダイレクトはlocationごと遷移したため、javascriptで受け取る
            Accept:
              'text/javascript, application/javascript, application/ecmascript',
          },
        })
        if (!response.ok) {
          dispatch({
            type: 'ERROR_AUTHENTICATE',
            error: 'INVALID_STATUS_CODE',
          })
          return
        }

        // window.location="https://..." というjsでリダイレクトさせてくる
        const match = (await response.text()).match(URL_REGEX)
        dispatch({
          type: 'FINISH_AUTHENTICATE',
          url: match ? match[0] : ROOT_URL,
        })
      } catch (error) {
        console.log(error)
        dispatch({ type: 'ERROR_AUTHENTICATE', error: 'AUTHENTICATE_FAILURE' })
      }
    },
}

export const Authentication: React.FC = () => {
  const [state, dispatch] = useReducerAsync(
    reducer,
    initialState,
    asyncActionHandlers,
  )
  const translation = useTranslation()
  const [accountToastId, setAccountToastId] = useState<string | null>(null)
  const [otpToastId, setOtpToastId] = useState<string | null>(null)

  useEffect(() => {
    dispatch({ type: 'AUTHENTICATE' })
  }, [])

  useEffect(() => {
    if (state) {
      if (accountToastId && state.message === 'AUTHENTICATING_OTP') {
        toast.success(t('AUTHENTICATING_ACCOUNT_SUCCESS'), {
          id: accountToastId,
        })
      }
      switch (state.status) {
        case 'loading':
          const id = toast.loading(t(state.message))
          if (state.message === 'AUTHENTICATING_ACCOUNT') {
            setAccountToastId(id)
          } else if (state.message === 'AUTHENTICATING_OTP') {
            setOtpToastId(id)
          }
          break
        case 'error':
          toast.error(
            <div>
              <div>{t(state.message)}</div>
              {state.showOpenOptions && (
                <button onClick={() => dispatch({ type: 'OPEN_OPTIONS' })}>
                  {t('OPEN_OPTIONS')}
                </button>
              )}
            </div>,
            {
              id: otpToastId ?? accountToastId ?? undefined,
            },
          )
          break
      }
    }
  }, [state])

  const t = (key: string): string => {
    return translation.t(`Authentication.${key}`)
  }

  return <Toaster />
}
