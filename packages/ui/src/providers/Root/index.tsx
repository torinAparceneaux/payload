'use client'
import type { I18nClient, Language } from '@payloadcms/translations'
import type { ClientConfig, LanguageOptions } from 'payload'

import { ModalContainer, ModalProvider } from '@faceless-ui/modal'
import { ScrollInfoProvider } from '@faceless-ui/scroll-info'
import { WindowInfoProvider } from '@faceless-ui/window-info'
import React, { Fragment } from 'react'

import type { Theme } from '../Theme/index.js'

import { LoadingOverlayProvider } from '../../elements/LoadingOverlay/index.js'
import { NavProvider } from '../../elements/Nav/context.js'
import { StayLoggedInModal } from '../../elements/StayLoggedIn/index.js'
import { StepNavProvider } from '../../elements/StepNav/index.js'
import { ActionsProvider } from '../Actions/index.js'
import { AuthProvider } from '../Auth/index.js'
import { ClientFunctionProvider } from '../ClientFunction/index.js'
import { ConfigProvider } from '../Config/index.js'
import { DocumentEventsProvider } from '../DocumentEvents/index.js'
import { FieldComponentsProvider } from '../FieldComponents/index.js'
import { LocaleProvider } from '../Locale/index.js'
import { ParamsProvider } from '../Params/index.js'
import { PreferencesProvider } from '../Preferences/index.js'
import { RouteCache } from '../RouteCache/index.js'
import { SearchParamsProvider } from '../SearchParams/index.js'
import { ThemeProvider } from '../Theme/index.js'
import { ToastContainer } from '../ToastContainer/index.js'
import { TranslationProvider } from '../Translation/index.js'

type Props = {
  children: React.ReactNode
  config: ClientConfig
  dateFNSKey: Language['dateFNSKey']
  fallbackLang: ClientConfig['i18n']['fallbackLanguage']
  languageCode: string
  languageOptions: LanguageOptions
  switchLanguageServerAction?: (lang: string) => Promise<void>
  theme: Theme
  translations: I18nClient['translations']
}

export const RootProvider: React.FC<Props> = ({
  children,
  config,
  dateFNSKey,
  fallbackLang,
  languageCode,
  languageOptions,
  switchLanguageServerAction,
  theme,
  translations,
}) => {
  return (
    <Fragment>
      <RouteCache>
        <ConfigProvider config={config}>
          <FieldComponentsProvider>
            <ClientFunctionProvider>
              <TranslationProvider
                dateFNSKey={dateFNSKey}
                fallbackLang={fallbackLang}
                language={languageCode}
                languageOptions={languageOptions}
                switchLanguageServerAction={switchLanguageServerAction}
                translations={translations}
              >
                <WindowInfoProvider
                  breakpoints={{
                    l: '(max-width: 1440px)',
                    m: '(max-width: 1024px)',
                    s: '(max-width: 768px)',
                    xs: '(max-width: 400px)',
                  }}
                >
                  <ScrollInfoProvider>
                    <SearchParamsProvider>
                      <ModalProvider classPrefix="payload" transTime={0} zIndex="var(--z-modal)">
                        <AuthProvider>
                          <PreferencesProvider>
                            <ThemeProvider cookiePrefix={config.cookiePrefix} theme={theme}>
                              <ParamsProvider>
                                <LocaleProvider>
                                  <StepNavProvider>
                                    <LoadingOverlayProvider>
                                      <DocumentEventsProvider>
                                        <ActionsProvider>
                                          <NavProvider>{children}</NavProvider>
                                        </ActionsProvider>
                                      </DocumentEventsProvider>
                                    </LoadingOverlayProvider>
                                  </StepNavProvider>
                                </LocaleProvider>
                              </ParamsProvider>
                            </ThemeProvider>
                          </PreferencesProvider>
                          <ModalContainer />
                          <StayLoggedInModal />
                        </AuthProvider>
                      </ModalProvider>
                    </SearchParamsProvider>
                  </ScrollInfoProvider>
                </WindowInfoProvider>
              </TranslationProvider>
            </ClientFunctionProvider>
          </FieldComponentsProvider>
        </ConfigProvider>
      </RouteCache>
      <ToastContainer />
    </Fragment>
  )
}
