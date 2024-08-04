import type { ClientFieldConfig } from '../../fields/config/client.js'
import type { ErrorComponent } from '../forms/Error.js'
import type { DescriptionComponent, FormFieldBase, LabelComponent } from '../types.js'

export type HiddenFieldProps = {
  readonly clientFieldConfig?: ClientFieldConfig
  readonly disableModifyingForm?: false
  readonly forceUsePathFromProps?: boolean
  readonly value?: unknown
} & FormFieldBase

export type HiddenFieldLabelComponent = LabelComponent<'hidden'>

export type HiddenFieldDescriptionComponent = DescriptionComponent<'hidden'>

export type HiddenFieldErrorComponent = ErrorComponent<'hidden'>
