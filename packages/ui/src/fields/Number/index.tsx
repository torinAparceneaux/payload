'use client'
import type { NumberFieldProps } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { isNumber } from 'payload/shared'
import React, { useCallback, useEffect, useState } from 'react'

import type { Option } from '../../elements/ReactSelect/types.js'

import { ReactSelect } from '../../elements/ReactSelect/index.js'
import { useFieldProps } from '../../forms/FieldPropsProvider/index.js'
import { useField } from '../../forms/useField/index.js'
import { withCondition } from '../../forms/withCondition/index.js'
import { RenderComponent } from '../../providers/Config/RenderComponent.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { FieldDescription } from '../FieldDescription/index.js'
import { FieldError } from '../FieldError/index.js'
import { FieldLabel } from '../FieldLabel/index.js'
import { fieldBaseClass } from '../shared/index.js'
import './index.scss'

const NumberFieldComponent: React.FC<NumberFieldProps> = (props) => {
  const {
    name,
    admin: {
      className,
      components: { Description, Error, Label, afterInput, beforeInput },
      description,
      placeholder,
      style,
      width,
    },
    descriptionProps,
    errorProps,
    hasMany = false,
    label,
    labelProps,
    max = Infinity,
    maxRows = Infinity,
    min = -Infinity,
    onChange: onChangeFromProps,
    path: pathFromProps,
    readOnly: readOnlyFromProps,
    required,
    step = 1,
    validate,
  } = props

  const { i18n, t } = useTranslation()

  const memoizedValidate = useCallback(
    (value, options) => {
      if (typeof validate === 'function') {
        return validate(value, { ...options, max, min, required })
      }
    },
    [validate, min, max, required],
  )

  const { path: pathFromContext, readOnly: readOnlyFromContext } = useFieldProps()

  const { formInitializing, formProcessing, path, setValue, showError, value } = useField<
    number | number[]
  >({
    path: pathFromContext ?? pathFromProps ?? name,
    validate: memoizedValidate,
  })

  const disabled = readOnlyFromProps || readOnlyFromContext || formProcessing || formInitializing

  const handleChange = useCallback(
    (e) => {
      const val = parseFloat(e.target.value)
      let newVal = val

      if (Number.isNaN(val)) {
        newVal = undefined
      }

      if (typeof onChangeFromProps === 'function') {
        onChangeFromProps(newVal)
      }

      setValue(newVal)
    },
    [onChangeFromProps, setValue],
  )

  const [valueToRender, setValueToRender] = useState<
    { id: string; label: string; value: { value: number } }[]
  >([]) // Only for hasMany

  const handleHasManyChange = useCallback(
    (selectedOption) => {
      if (!disabled) {
        let newValue
        if (!selectedOption) {
          newValue = []
        } else if (Array.isArray(selectedOption)) {
          newValue = selectedOption.map((option) => Number(option.value?.value || option.value))
        } else {
          newValue = [Number(selectedOption.value?.value || selectedOption.value)]
        }

        setValue(newValue)
      }
    },
    [disabled, setValue],
  )

  // useEffect update valueToRender:
  useEffect(() => {
    if (hasMany && Array.isArray(value)) {
      setValueToRender(
        value.map((val, index) => {
          return {
            id: `${val}${index}`, // append index to avoid duplicate keys but allow duplicate numbers
            label: `${val}`,
            value: {
              toString: () => `${val}${index}`,
              value: (val as unknown as Record<string, number>)?.value || val,
            }, // You're probably wondering, why the hell is this done that way? Well, React-select automatically uses "label-value" as a key, so we will get that react duplicate key warning if we just pass in the value as multiple values can be the same. So we need to append the index to the toString() of the value to avoid that warning, as it uses that as the key.
          }
        }),
      )
    }
  }, [value, hasMany])

  return (
    <div
      className={[
        fieldBaseClass,
        'number',
        className,
        showError && 'error',
        disabled && 'read-only',
        hasMany && 'has-many',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        ...style,
        width,
      }}
    >
      <FieldLabel CustomLabel={Label} label={label} required={required} {...(labelProps || {})} />
      <div className={`${fieldBaseClass}__wrap`}>
        <FieldError CustomError={Error} path={path} {...(errorProps || {})} />
        {hasMany ? (
          <ReactSelect
            className={`field-${path.replace(/\./g, '__')}`}
            disabled={disabled}
            filterOption={(_, rawInput) => {
              const isOverHasMany = Array.isArray(value) && value.length >= maxRows
              return isNumber(rawInput) && !isOverHasMany
            }}
            isClearable
            isCreatable
            isMulti
            isSortable
            noOptionsMessage={() => {
              const isOverHasMany = Array.isArray(value) && value.length >= maxRows
              if (isOverHasMany) {
                return t('validation:limitReached', { max: maxRows, value: value.length + 1 })
              }
              return null
            }}
            // numberOnly
            onChange={handleHasManyChange}
            options={[]}
            placeholder={t('general:enterAValue')}
            showError={showError}
            value={valueToRender as Option[]}
          />
        ) : (
          <div>
            <RenderComponent mappedComponent={beforeInput} />
            <input
              disabled={disabled}
              id={`field-${path.replace(/\./g, '__')}`}
              max={max}
              min={min}
              name={path}
              onChange={handleChange}
              onWheel={(e) => {
                // @ts-expect-error
                e.target.blur()
              }}
              placeholder={getTranslation(placeholder, i18n)}
              step={step}
              type="number"
              value={typeof value === 'number' ? value : ''}
            />
            <RenderComponent mappedComponent={afterInput} />
          </div>
        )}
        <FieldDescription
          CustomDescription={Description}
          description={description}
          {...(descriptionProps || {})}
        />
      </div>
    </div>
  )
}

export const NumberField = withCondition(NumberFieldComponent)
