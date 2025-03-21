import React, { useEffect, useState } from 'react'
import { render } from './config'
import {
  Button,
  FormControl,
  FormLabel,
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
  VStack,
  useToast,
} from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai'
import { accountBucket } from './storage/Accout'

const App = () => {
  const translation = useTranslation()
  const toast = useToast()
  const [id, setId] = useState('')
  const [idIsInvalid, setIdIsInvalid] = useState(false)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [passwordIsInvalid, setPasswordIsInvalid] = useState(false)
  const [otpSecret, setOtpSecret] = useState('')
  const [otpSecretIsInvalid, setOtpSecretIsInvalid] = useState(false)

  const validate = () => {
    const idIsValid = id.length > 0
    const passwordIsValid = password.length > 0
    const otpSecretIsValid = otpSecret.length > 0
    setIdIsInvalid(!idIsValid)
    setPasswordIsInvalid(!passwordIsValid)
    setOtpSecretIsInvalid(!otpSecretIsValid)
    return idIsValid && passwordIsValid && otpSecretIsValid
  }

  // 値の初期化
  useEffect(() => {
    accountBucket.get().then(({ id, password, otpSecret }) => {
      if (id !== undefined) setId(id)
      if (password !== undefined) setPassword(password)
      if (otpSecret !== undefined) setOtpSecret(otpSecret)
    })
  }, [])

  const t = (key: string): string => translation.t(`Options.${key}`)

  return (
    <VStack margin={4}>
      <FormControl isInvalid={idIsInvalid}>
        <FormLabel>{t('ACCOUNT')}</FormLabel>
        <Input value={id} onChange={(e) => setId(e.target.value)} />
      </FormControl>
      <FormControl isInvalid={passwordIsInvalid}>
        <FormLabel>{t('PASSWORD')}</FormLabel>
        <InputGroup>
          <Input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <InputRightElement>
            <IconButton
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              icon={showPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
              variant="ghost"
              onClick={() => setShowPassword(!showPassword)}
            />
          </InputRightElement>
        </InputGroup>
      </FormControl>
      <FormControl isInvalid={otpSecretIsInvalid}>
        <FormLabel>{t('OTP_SECRET')}</FormLabel>
        <Input
          value={otpSecret}
          onChange={(e) => setOtpSecret(e.target.value)}
        />
      </FormControl>
      <Button
        variant="solid"
        bgColor="#005C92"
        color="white"
        _hover={{ bgColor: '#005C9280' }}
        onClick={() => {
          if (validate()) {
            accountBucket
              .set({ id, password, otpSecret })
              .then(() =>
                toast({
                  title: t('SAVED'),
                  status: 'success',
                }),
              )
              .catch(() =>
                toast({
                  title: t('UNKNOWN_ERROR'),
                  status: 'error',
                }),
              )
          } else {
            toast({
              title: t('INVALID_VALUE'),
              status: 'error',
            })
          }
        }}
      >
        {t('SAVE')}
      </Button>
    </VStack>
  )
}

render(<App />)
