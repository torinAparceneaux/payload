'use client'
import type { ClientConfig } from 'payload'

import React, { createContext, useCallback, useContext } from 'react'

export type ClientConfigContext = {
  config: ClientConfig
  getEntityConfig: (args: {
    collectionSlug?: string
    globalSlug?: string
  }) => ClientConfig['collections'][number] | ClientConfig['globals'][number]
}

const Context = createContext<ClientConfigContext | undefined>(undefined)

export const ConfigProvider: React.FC<{
  readonly children: React.ReactNode
  readonly config: ClientConfig
}> = ({ children, config }) => {
  const getEntityConfig = useCallback(
    ({ collectionSlug, globalSlug }: { collectionSlug?: string; globalSlug?: string }) => {
      if (collectionSlug) {
        return config.collections.find((collection) => collection.slug === collectionSlug)
      }

      if (globalSlug) {
        return config.globals.find((global) => global.slug === globalSlug)
      }

      return null
    },
    [config],
  )

  return <Context.Provider value={{ config, getEntityConfig }}>{children}</Context.Provider>
}

export const useConfig = (): ClientConfigContext => useContext(Context)
