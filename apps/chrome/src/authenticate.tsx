import React from 'react'
import { Authentication } from './component/Authentication'
import { createRoot } from 'react-dom/client'
import { i18next } from './localization/config'

const renderAuthentication = () => {
  const appWrapper = document.createElement('div')
  document.body.insertBefore(appWrapper, document.body.firstChild)
  createRoot(appWrapper).render(<Authentication />)
}

renderAuthentication()
i18next.changeLanguage('ja')
