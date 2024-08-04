import type { MappedComponent, StaticDescription, StaticLabel } from 'payload'
import type { ChangeEvent } from 'react'

import type { Option, ReactSelectAdapterProps } from '../../elements/ReactSelect/types.js'

export type SharedTextFieldProps =
  | {
      readonly hasMany?: false
      readonly onChange?: (e: ChangeEvent<HTMLInputElement>) => void
    }
  | {
      readonly hasMany?: true
      readonly onChange?: ReactSelectAdapterProps['onChange']
    }

export type TextInputProps = {
  readonly Description?: MappedComponent
  readonly Error?: MappedComponent
  readonly Label?: MappedComponent
  readonly afterInput?: MappedComponent[]
  readonly beforeInput?: MappedComponent[]
  readonly className?: string
  readonly description?: StaticDescription
  readonly descriptionProps?: Record<string, unknown>
  readonly errorProps?: Record<string, unknown>
  readonly inputRef?: React.MutableRefObject<HTMLInputElement>
  readonly label: StaticLabel
  readonly labelProps?: Record<string, unknown>
  readonly maxRows?: number
  readonly minRows?: number
  readonly onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>
  readonly path: string
  readonly placeholder?: string
  readonly readOnly?: boolean
  readonly required?: boolean
  readonly rtl?: boolean
  readonly showError?: boolean
  readonly style?: React.CSSProperties
  readonly value?: string
  readonly valueToRender?: Option[]
  readonly width?: string
} & SharedTextFieldProps
