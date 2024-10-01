import React, { useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import {
  ChakraProvider,
  extendTheme,
  useColorMode,
  useColorModePreference,
} from '@chakra-ui/react'
import './localization/config'

const theme = extendTheme()

type ColorMode = 'light' | 'dark' | 'system'

const App = (props: { node: React.ReactNode; colorMode: ColorMode }) => {
  const { setColorMode } = useColorMode()
  const systemColorMode = useColorModePreference()

  useEffect(() => {
    if (props.colorMode === 'system') {
      setColorMode(systemColorMode)
    } else {
      setColorMode(props.colorMode)
    }
  }, [systemColorMode])

  return <div id="app">{props.node}</div>
}

export const render = (
  node: React.ReactNode,
  appWrapper?: HTMLElement,
  colorMode: ColorMode = 'system',
) => {
  const container =
    appWrapper ?? document.body.appendChild(document.createElement('div'))
  createRoot(container).render(
    <ChakraProvider
      theme={theme}
      resetCSS={true}
      toastOptions={{ defaultOptions: { position: 'top', isClosable: true } }}
    >
      <App node={node} colorMode={colorMode} />
    </ChakraProvider>,
  )
}
