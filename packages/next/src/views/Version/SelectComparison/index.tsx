'use client'

import type { PaginatedDocs, Where } from 'payload'

import { ReactSelect, fieldBaseClass, useConfig, useTranslation } from '@payloadcms/ui'
import { formatDate } from '@payloadcms/ui/shared'
import * as qs from 'qs-esm'
import React, { useCallback, useEffect, useState } from 'react'

import type { Props } from './types.js'

import { renderPill } from '../../Versions/cells/AutosaveCell/index.js'
import './index.scss'

const baseClass = 'compare-version'

const maxResultsPerRequest = 10

const baseOptions = []

export const SelectComparison: React.FC<Props> = (props) => {
  const {
    baseURL,
    latestDraftVersion,
    latestPublishedVersion,
    onChange,
    parentID,
    value,
    versionID,
  } = props

  const {
    config: {
      admin: { dateFormat },
    },
  } = useConfig()

  const [options, setOptions] = useState<
    {
      label: React.ReactNode | string
      value: string
    }[]
  >(baseOptions)
  const [lastLoadedPage, setLastLoadedPage] = useState(1)
  const [errorLoading, setErrorLoading] = useState('')
  const { i18n, t } = useTranslation()
  const loadedAllOptionsRef = React.useRef(false)

  const getResults = useCallback(
    async ({ lastLoadedPage: lastLoadedPageArg }) => {
      if (loadedAllOptionsRef.current) return
      const query: {
        [key: string]: unknown
        where: Where
      } = {
        depth: 0,
        limit: maxResultsPerRequest,
        page: lastLoadedPageArg,
        where: {
          and: [
            {
              id: {
                not_equals: versionID,
              },
            },
          ],
        },
      }

      if (parentID) {
        query.where.and.push({
          parent: {
            equals: parentID,
          },
        })
      }

      const search = qs.stringify(query)

      const response = await fetch(`${baseURL}?${search}`, {
        credentials: 'include',
        headers: {
          'Accept-Language': i18n.language,
        },
      })

      if (response.ok) {
        const data: PaginatedDocs = await response.json()

        if (data.docs.length > 0) {
          const versionInfo = {
            draft: {
              currentLabel: t('version:currentDraft'),
              latestVersion: latestDraftVersion,
              pillStyle: undefined,
              previousLabel: t('version:draft'),
            },
            published: {
              currentLabel: t('version:currentPublishedVersion'),
              latestVersion: latestPublishedVersion,
              pillStyle: 'success',
              previousLabel: t('version:previouslyPublished'),
            },
          }

          const additionalOptions = data.docs.map((doc) => {
            const status = doc.version._status
            const { currentLabel, latestVersion, pillStyle, previousLabel } =
              versionInfo[status] || {}

            return {
              label: (
                <div>
                  {formatDate({ date: doc.updatedAt, i18n, pattern: dateFormat })}
                  &nbsp;&nbsp;
                  {renderPill(doc, latestVersion, currentLabel, previousLabel, pillStyle)}
                </div>
              ),
              value: doc.id,
            }
          })

          setOptions((existingOptions) => [...existingOptions, ...additionalOptions])

          if (!data.hasNextPage) {
            loadedAllOptionsRef.current = true
          }
          setLastLoadedPage(data.page)
        }
      } else {
        setErrorLoading(t('error:unspecific'))
      }
    },
    [dateFormat, baseURL, parentID, versionID, t, i18n, latestDraftVersion, latestPublishedVersion],
  )

  useEffect(() => {
    void getResults({ lastLoadedPage: 1 })
  }, [getResults])

  const filteredOptions = options.filter(
    (option, index, self) => self.findIndex((t) => t.value === option.value) === index,
  )

  useEffect(() => {
    if (filteredOptions.length > 0 && !value) {
      onChange(filteredOptions[0])
    }
  }, [filteredOptions, value, onChange])

  return (
    <div
      className={[fieldBaseClass, baseClass, errorLoading && 'error-loading']
        .filter(Boolean)
        .join(' ')}
    >
      <div className={`${baseClass}__label`}>{t('version:compareVersion')}</div>
      {!errorLoading && (
        <ReactSelect
          isClearable={false}
          isSearchable={false}
          onChange={onChange}
          onMenuScrollToBottom={() => {
            void getResults({ lastLoadedPage: lastLoadedPage + 1 })
          }}
          options={filteredOptions}
          placeholder={t('version:selectVersionToCompare')}
          value={value}
        />
      )}
      {errorLoading && <div className={`${baseClass}__error-loading`}>{errorLoading}</div>}
    </div>
  )
}
