'use client'

import type { MappedComponent } from 'payload'

import React, { useCallback, useRef } from 'react'

import { useForm, useFormModified } from '../../forms/Form/context.js'
import { FormSubmit } from '../../forms/Submit/index.js'
import { useHotkey } from '../../hooks/useHotkey.js'
import { RenderComponent } from '../../providers/ComponentMap/RenderComponent.js'
import { useConfig } from '../../providers/Config/index.js'
import { useDocumentInfo } from '../../providers/DocumentInfo/index.js'
import { useEditDepth } from '../../providers/EditDepth/index.js'
import { useLocale } from '../../providers/Locale/index.js'
import { useOperation } from '../../providers/Operation/index.js'
import { useTranslation } from '../../providers/Translation/index.js'

const baseClass = 'save-draft'

export const DefaultSaveDraftButton: React.FC = () => {
  const {
    config: {
      routes: { api },
      serverURL,
    },
  } = useConfig()
  const { id, collectionSlug, globalSlug } = useDocumentInfo()
  const modified = useFormModified()
  const { code: locale } = useLocale()
  const ref = useRef<HTMLButtonElement>(null)
  const editDepth = useEditDepth()
  const { t } = useTranslation()
  const { submit } = useForm()
  const operation = useOperation()

  const forceDisable = operation === 'update' && !modified

  const saveDraft = useCallback(async () => {
    if (forceDisable) return

    const search = `?locale=${locale}&depth=0&fallback-locale=null&draft=true`
    let action
    let method = 'POST'

    if (collectionSlug) {
      action = `${serverURL}${api}/${collectionSlug}${id ? `/${id}` : ''}${search}`
      if (id) method = 'PATCH'
    }

    if (globalSlug) {
      action = `${serverURL}${api}/globals/${globalSlug}${search}`
    }

    await submit({
      action,
      method,
      overrides: {
        _status: 'draft',
      },
      skipValidation: true,
    })
  }, [submit, collectionSlug, globalSlug, serverURL, api, locale, id, forceDisable])

  useHotkey({ cmdCtrlKey: true, editDepth, keyCodes: ['s'] }, (e) => {
    if (forceDisable) {
      // absorb the event
    }

    e.preventDefault()
    e.stopPropagation()
    if (ref?.current) {
      ref.current.click()
    }
  })

  return (
    <FormSubmit
      buttonId="action-save-draft"
      buttonStyle="secondary"
      className={baseClass}
      disabled={forceDisable}
      onClick={saveDraft}
      ref={ref}
      size="small"
      type="button"
    >
      {t('version:saveDraft')}
    </FormSubmit>
  )
}

type Props = {
  CustomComponent?: MappedComponent
}

export const SaveDraftButton: React.FC<Props> = ({ CustomComponent }) => {
  if (CustomComponent) return <RenderComponent mappedComponent={CustomComponent} />
  return <DefaultSaveDraftButton />
}
