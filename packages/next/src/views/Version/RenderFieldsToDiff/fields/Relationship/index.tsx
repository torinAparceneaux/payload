'use client'
import type { ClientCollectionConfig, MappedField } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { useConfig } from '@payloadcms/ui'
import { fieldAffectsData, fieldIsPresentationalOnly } from 'payload/shared'
import React from 'react'
import ReactDiffViewerImport from 'react-diff-viewer-continued'

import type { Props } from '../types.js'

import Label from '../../Label/index.js'
import { diffStyles } from '../styles.js'
import './index.scss'

const ReactDiffViewer = (ReactDiffViewerImport.default ||
  ReactDiffViewerImport) as unknown as typeof ReactDiffViewerImport.default

const baseClass = 'relationship-diff'

type RelationshipValue = Record<string, any>

const generateLabelFromValue = (
  collections: ClientCollectionConfig[],
  field: MappedField,
  locale: string,
  value: { relationTo: string; value: RelationshipValue } | RelationshipValue,
): string => {
  if (Array.isArray(value)) {
    return value
      .map((v) => generateLabelFromValue(collections, field, locale, v))
      .filter(Boolean) // Filters out any undefined or empty values
      .join(', ')
  }

  let relation: string
  let relatedDoc: RelationshipValue
  let valueToReturn = '' as any
  const relatedDocValue = value?.value

  const relationTo =
    'relationTo' in field.fieldComponentProps ? field.fieldComponentProps.relationTo : undefined

  if (value === null || typeof value === 'undefined') {
    return String(value)
  }

  if (Array.isArray(relationTo)) {
    if (typeof value === 'object') {
      relation = value.relationTo
      relatedDoc = value.value
    }
  } else {
    relation = relationTo
    relatedDoc = relatedDocValue
  }

  const relatedCollection = collections.find((c) => c.slug === relation)

  if (relatedCollection) {
    const useAsTitle = relatedCollection?.admin?.useAsTitle
    const useAsTitleField = relatedCollection.fields.find(
      (f) => fieldAffectsData(f) && !fieldIsPresentationalOnly(f) && f.name === useAsTitle,
    )
    let titleFieldIsLocalized = false

    if (useAsTitleField && fieldAffectsData(useAsTitleField))
      titleFieldIsLocalized = useAsTitleField.localized

    if (typeof relatedDoc?.[useAsTitle] !== 'undefined') {
      valueToReturn = relatedDoc[useAsTitle]
    } else if (typeof relatedDoc?.id !== 'undefined') {
      valueToReturn = relatedDoc.id
    } else {
      valueToReturn = relatedDoc
    }

    if (typeof valueToReturn === 'object' && titleFieldIsLocalized) {
      valueToReturn = valueToReturn[locale]
    }
  }

  if (typeof valueToReturn === 'object' && valueToReturn !== null) {
    valueToReturn = JSON.stringify(valueToReturn)
  }

  return valueToReturn
}

const Relationship: React.FC<Props> = ({ comparison, field, i18n, locale, version }) => {
  const placeholder = `[${i18n.t('general:noValue')}]`

  const { collections } = useConfig()

  let versionToRender: string | undefined = version
    ? generateLabelFromValue(collections, field, locale, version)
    : placeholder

  let comparisonToRender: string | undefined = comparison
    ? generateLabelFromValue(collections, field, locale, comparison)
    : placeholder

  if ('hasMany' in field && field.hasMany) {
    if (Array.isArray(version)) {
      versionToRender =
        version.map((val) => generateLabelFromValue(collections, field, locale, val)).join(', ') ||
        placeholder
    }
    if (Array.isArray(comparison)) {
      comparisonToRender =
        comparison
          .map((val) => generateLabelFromValue(collections, field, locale, val))
          .join(', ') || placeholder
    }
  }

  const label =
    'label' in field.fieldComponentProps &&
    typeof field.fieldComponentProps.label !== 'boolean' &&
    typeof field.fieldComponentProps.label !== 'function'
      ? field.fieldComponentProps.label
      : ''

  return (
    <div className={baseClass}>
      <Label>
        {locale && <span className={`${baseClass}__locale-label`}>{locale}</span>}
        {getTranslation(label, i18n)}
      </Label>
      <ReactDiffViewer
        hideLineNumbers
        newValue={versionToRender}
        oldValue={comparisonToRender}
        showDiffOnly={false}
        splitView
        styles={diffStyles}
      />
    </div>
  )
}

export default Relationship
