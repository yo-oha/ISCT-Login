import { getBucket } from '@extend-chrome/storage'

export interface Account {
  id: string
  password: string
  otpSecret: string
}

export const accountBucket = getBucket<Account>('account', 'sync')
