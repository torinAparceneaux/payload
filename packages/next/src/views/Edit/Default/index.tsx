'use client'

import type { ClientCollectionConfig, ClientGlobalConfig } from 'payload'

import {
  DocumentControls,
  DocumentFields,
  Form,
  type FormProps,
  OperationProvider,
  RenderComponent,
  Upload,
  useAuth,
  useConfig,
  useDocumentEvents,
  useDocumentInfo,
  useEditDepth,
  useUploadEdits,
} from '@payloadcms/ui'
import { formatAdminURL, getFormState } from '@payloadcms/ui/shared'
import { useRouter, useSearchParams } from 'next/navigation.js'
import React, { Fragment, useCallback, useState } from 'react'

import { LeaveWithoutSaving } from '../../../elements/LeaveWithoutSaving/index.js'
import { Auth } from './Auth/index.js'
import { SetDocumentStepNav } from './SetDocumentStepNav/index.js'
import { SetDocumentTitle } from './SetDocumentTitle/index.js'
import './index.scss'

const baseClass = 'collection-edit'

// This component receives props only on _pages_
// When rendered within a drawer, props are empty
// This is solely to support custom edit views which get server-rendered
export const DefaultEditView: React.FC = () => {
  const {
    id,
    AfterDocument,
    AfterFields,
    BeforeDocument,
    BeforeFields,
    action,
    apiURL,
    collectionSlug,
    disableActions,
    disableLeaveWithoutSaving,
    docPermissions,
    getDocPreferences,
    getVersions,
    globalSlug,
    hasPublishPermission,
    hasSavePermission,
    initialData: data,
    initialState,
    isEditing,
    isInitializing,
    onSave: onSaveFromContext,
  } = useDocumentInfo()

  const { refreshCookieAsync, user } = useAuth()

  const {
    config,
    config: {
      admin: { user: userSlug },
      routes: { admin: adminRoute, api: apiRoute },
      serverURL,
    },
    getEntityConfig,
  } = useConfig()

  const router = useRouter()
  const depth = useEditDepth()
  const params = useSearchParams()
  const { reportUpdate } = useDocumentEvents()
  const { resetUploadEdits } = useUploadEdits()

  const locale = params.get('locale')

  const collectionClientConfig = getEntityConfig({ collectionSlug }) as ClientCollectionConfig

  const globalConfig = getEntityConfig({ globalSlug }) as ClientGlobalConfig

  const entitySlug = collectionClientConfig?.slug || globalConfig?.slug

  const operation = collectionSlug && !id ? 'create' : 'update'

  const auth = collectionClientConfig ? collectionClientConfig.auth : undefined
  const upload = collectionClientConfig ? collectionClientConfig.upload : undefined

  const preventLeaveWithoutSaving =
    (!(
      collectionClientConfig?.versions?.drafts && collectionClientConfig?.versions?.drafts?.autosave
    ) ||
      !(globalConfig?.versions?.drafts && globalConfig?.versions?.drafts?.autosave)) &&
    !disableLeaveWithoutSaving

  const classes = [baseClass, id && `${baseClass}--is-editing`].filter(Boolean).join(' ')

  const [schemaPath, setSchemaPath] = React.useState(entitySlug)
  const [validateBeforeSubmit, setValidateBeforeSubmit] = useState(false)

  const onSave = useCallback(
    (json) => {
      reportUpdate({
        id,
        entitySlug,
        updatedAt: json?.result?.updatedAt || new Date().toISOString(),
      })

      // If we're editing the doc of the logged-in user,
      // Refresh the cookie to get new permissions
      if (user && collectionSlug === userSlug && id === user.id) {
        void refreshCookieAsync()
      }

      void getVersions()

      if (typeof onSaveFromContext === 'function') {
        void onSaveFromContext({
          ...json,
          operation: id ? 'update' : 'create',
        })
      }

      if (!isEditing && depth < 2) {
        // Redirect to the same locale if it's been set
        const redirectRoute = formatAdminURL({
          adminRoute,
          path: `/collections/${collectionSlug}/${json?.doc?.id}${locale ? `?locale=${locale}` : ''}`,
        })
        router.push(redirectRoute)
      } else {
        resetUploadEdits()
      }
    },
    [
      onSaveFromContext,
      userSlug,
      reportUpdate,
      id,
      entitySlug,
      user,
      depth,
      collectionSlug,
      getVersions,
      isEditing,
      refreshCookieAsync,
      adminRoute,
      router,
      locale,
      resetUploadEdits,
    ],
  )

  const onChange: FormProps['onChange'][0] = useCallback(
    async ({ formState: prevFormState }) => {
      const docPreferences = await getDocPreferences()
      return getFormState({
        apiRoute,
        body: {
          id,
          collectionSlug,
          docPreferences,
          formState: prevFormState,
          globalSlug,
          operation,
          schemaPath,
        },
        serverURL,
      })
    },
    [apiRoute, collectionSlug, schemaPath, getDocPreferences, globalSlug, id, operation, serverURL],
  )

  return (
    <main className={classes}>
      <OperationProvider operation={operation}>
        <Form
          action={action}
          className={`${baseClass}__form`}
          disableValidationOnSubmit={!validateBeforeSubmit}
          disabled={isInitializing || !hasSavePermission}
          initialState={!isInitializing && initialState}
          isInitializing={isInitializing}
          method={id ? 'PATCH' : 'POST'}
          onChange={[onChange]}
          onSuccess={onSave}
        >
          {BeforeDocument}
          {preventLeaveWithoutSaving && <LeaveWithoutSaving />}
          <SetDocumentStepNav
            collectionSlug={collectionClientConfig?.slug}
            globalSlug={globalConfig?.slug}
            id={id}
            pluralLabel={collectionClientConfig?.labels?.plural}
            useAsTitle={collectionClientConfig?.admin?.useAsTitle}
          />
          <SetDocumentTitle
            collectionConfig={collectionClientConfig}
            config={config}
            fallback={depth <= 1 ? id?.toString() : undefined}
            globalConfig={globalConfig}
          />
          <DocumentControls
            apiURL={apiURL}
            data={data}
            disableActions={disableActions}
            hasPublishPermission={hasPublishPermission}
            hasSavePermission={hasSavePermission}
            id={id}
            isEditing={isEditing}
            permissions={docPermissions}
            slug={collectionClientConfig?.slug || globalConfig?.slug}
          />
          <DocumentFields
            AfterFields={AfterFields}
            BeforeFields={
              BeforeFields || (
                <Fragment>
                  {auth && (
                    <Auth
                      className={`${baseClass}__auth`}
                      collectionSlug={collectionClientConfig.slug}
                      disableLocalStrategy={collectionClientConfig.auth?.disableLocalStrategy}
                      email={data?.email}
                      loginWithUsername={auth?.loginWithUsername}
                      operation={operation}
                      readOnly={!hasSavePermission}
                      requirePassword={!id}
                      setSchemaPath={setSchemaPath}
                      setValidateBeforeSubmit={setValidateBeforeSubmit}
                      useAPIKey={auth.useAPIKey}
                      username={data?.username}
                      verify={auth.verify}
                    />
                  )}
                  {upload && (
                    <React.Fragment>
                      {collectionClientConfig?.admin?.components?.Upload ? (
                        <RenderComponent
                          mappedComponent={collectionClientConfig.admin.components.Upload}
                        />
                      ) : (
                        <Upload
                          collectionSlug={collectionClientConfig.slug}
                          initialState={initialState}
                          uploadConfig={upload}
                        />
                      )}
                    </React.Fragment>
                  )}
                </Fragment>
              )
            }
            docPermissions={docPermissions}
            fields={(collectionClientConfig || globalConfig)?.fields}
            readOnly={!hasSavePermission}
            schemaPath={schemaPath}
          />
          {AfterDocument}
        </Form>
      </OperationProvider>
    </main>
  )
}
