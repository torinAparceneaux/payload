'use client'

import { confirmPassword } from 'payload/shared'
import React from 'react'

import { useField } from '../../forms/useField/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { FieldError } from '../FieldError/index.js'
import { FieldLabel } from '../FieldLabel/index.js'
import { fieldBaseClass } from '../shared/index.js'
import './index.scss'

export type ConfirmPasswordFieldProps = {
  disabled?: boolean
  path?: string
}

export const ConfirmPasswordField: React.FC<ConfirmPasswordFieldProps> = (props) => {
  const { disabled, path = 'confirm-password' } = props
  const { t } = useTranslation()

  const { setValue, showError, value } = useField({
    path,
    validate: (value, options) => {
      return confirmPassword(value, { required: true, ...options })
    },
  })

  return (
    <div
      className={[fieldBaseClass, 'confirm-password', showError && 'error']
        .filter(Boolean)
        .join(' ')}
    >
      <FieldLabel
        htmlFor="field-confirm-password"
        label={t('authentication:confirmPassword')}
        required
      />
      <div className={`${fieldBaseClass}__wrap`}>
        <FieldError path={path} />
        <input
          aria-label={t('authentication:confirmPassword')}
          autoComplete="off"
          disabled={!!disabled}
          id="field-confirm-password"
          name="confirm-password"
          onChange={setValue}
          type="password"
          value={(value as string) || ''}
        />
      </div>
    </div>
  )
}
