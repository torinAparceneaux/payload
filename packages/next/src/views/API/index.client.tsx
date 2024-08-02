'use client'

import type { ClientCollectionConfig, ClientGlobalConfig } from 'payload'

import {
  CheckboxField,
  CopyToClipboard,
  Form,
  Gutter,
  MinimizeMaximizeIcon,
  NumberField as NumberInput,
  SetViewActions,
  useConfig,
  useDocumentInfo,
  useLocale,
  useTranslation,
} from '@payloadcms/ui'
import { useSearchParams } from 'next/navigation.js'
import * as React from 'react'
import { toast } from 'sonner'

import { SetDocumentStepNav } from '../Edit/Default/SetDocumentStepNav/index.js'
import { LocaleSelector } from './LocaleSelector/index.js'
import { RenderJSON } from './RenderJSON/index.js'
import './index.scss'

const baseClass = 'query-inspector'

export const APIViewClient: React.FC = () => {
  const { id, collectionSlug, globalSlug, initialData } = useDocumentInfo()

  const searchParams = useSearchParams()
  const { i18n, t } = useTranslation()
  const { code } = useLocale()

  const {
    config: {
      localization,
      routes: { api: apiRoute },
      serverURL,
    },
    getEntityConfig,
  } = useConfig()

  const collectionClientConfig = getEntityConfig({ collectionSlug }) as ClientCollectionConfig
  const globalClientConfig = getEntityConfig({ globalSlug }) as ClientGlobalConfig

  const localeOptions =
    localization &&
    localization.locales.map((locale) => ({ label: locale.label, value: locale.code }))

  let draftsEnabled: boolean = false
  let docEndpoint: string = ''

  if (collectionClientConfig) {
    draftsEnabled = Boolean(collectionClientConfig.versions?.drafts)
    docEndpoint = `/${collectionSlug}/${id}`
  }

  if (globalClientConfig) {
    draftsEnabled = Boolean(globalClientConfig.versions?.drafts)
    docEndpoint = `/globals/${globalSlug}`
  }

  const [data, setData] = React.useState<any>(initialData)
  const [draft, setDraft] = React.useState<boolean>(searchParams.get('draft') === 'true')
  const [locale, setLocale] = React.useState<string>(searchParams?.get('locale') || code)
  const [depth, setDepth] = React.useState<string>(searchParams.get('depth') || '1')
  const [authenticated, setAuthenticated] = React.useState<boolean>(true)
  const [fullscreen, setFullscreen] = React.useState<boolean>(false)

  const params = new URLSearchParams({
    depth,
    draft: String(draft),
    locale,
  }).toString()

  const fetchURL = `${serverURL}${apiRoute}${docEndpoint}?${params}`

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(fetchURL, {
          credentials: authenticated ? 'include' : 'omit',
          headers: {
            'Accept-Language': i18n.language,
          },
          method: 'GET',
        })

        try {
          const json = await res.json()
          setData(json)
        } catch (error) {
          toast.error('Error parsing response')
          console.error(error) // eslint-disable-line no-console
        }
      } catch (error) {
        toast.error('Error making request')
        console.error(error) // eslint-disable-line no-console
      }
    }

    void fetchData()
  }, [i18n.language, fetchURL, authenticated])

  return (
    <Gutter
      className={[baseClass, fullscreen && `${baseClass}--fullscreen`].filter(Boolean).join(' ')}
      right={false}
    >
      <SetDocumentStepNav
        collectionSlug={collectionSlug}
        globalLabel={globalClientConfig?.label}
        globalSlug={globalSlug}
        id={id}
        pluralLabel={collectionClientConfig ? collectionClientConfig?.labels?.plural : undefined}
        useAsTitle={collectionClientConfig ? collectionClientConfig?.admin?.useAsTitle : undefined}
        view="API"
      />
      <SetViewActions
        actions={
          (collectionClientConfig || globalClientConfig)?.admin?.components?.views?.Edit?.API
            ?.actions
        }
      />
      <div className={`${baseClass}__configuration`}>
        <div className={`${baseClass}__api-url`}>
          <span className={`${baseClass}__label`}>
            API URL <CopyToClipboard value={fetchURL} />
          </span>
          <a href={fetchURL} rel="noopener noreferrer" target="_blank">
            {fetchURL}
          </a>
        </div>
        <Form
          initialState={{
            authenticated: {
              initialValue: authenticated || false,
              valid: true,
              value: authenticated || false,
            },
            depth: {
              initialValue: Number(depth || 0),
              valid: true,
              value: Number(depth || 0),
            },
            draft: {
              initialValue: draft || false,
              valid: true,
              value: draft || false,
            },
            locale: {
              initialValue: locale,
              valid: true,
              value: locale,
            },
          }}
        >
          <div className={`${baseClass}__form-fields`}>
            <div className={`${baseClass}__filter-query-checkboxes`}>
              {draftsEnabled && (
                <CheckboxField
                  label={t('version:draft')}
                  name="draft"
                  onChange={() => setDraft(!draft)}
                  path="draft"
                />
              )}
              <CheckboxField
                label={t('authentication:authenticated')}
                name="authenticated"
                onChange={() => setAuthenticated(!authenticated)}
                path="authenticated"
              />
            </div>
            {localeOptions && <LocaleSelector localeOptions={localeOptions} onChange={setLocale} />}
            <NumberInput
              label={t('general:depth')}
              max={10}
              min={0}
              name="depth"
              onChange={(value) => setDepth(value?.toString())}
              path="depth"
              step={1}
            />
          </div>
        </Form>
      </div>
      <div className={`${baseClass}__results-wrapper`}>
        <div className={`${baseClass}__toggle-fullscreen-button-container`}>
          <button
            aria-label="toggle fullscreen"
            className={`${baseClass}__toggle-fullscreen-button`}
            onClick={() => setFullscreen(!fullscreen)}
            type="button"
          >
            <MinimizeMaximizeIcon isMinimized={!fullscreen} />
          </button>
        </div>
        <div className={`${baseClass}__results`}>
          <RenderJSON object={data} />
        </div>
      </div>
    </Gutter>
  )
}
