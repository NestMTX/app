import type { renderAsDefault } from '../../utilities/renderers'
import type { ValidationRule } from '../../utilities/validations'

export type ModelIndexFieldRenderer = typeof renderAsDefault

export interface ModelIndexFieldTextFormatter {
  (value: unknown, row: Record<string, unknown>): string
}

export interface ModelIndexActionCallback {
  (row: Record<string, unknown>): void | Promise<void>
}

export interface ModelIndexActionCondition {
  (row: Record<string, unknown>): boolean
}

export interface ModelIndexAction {
  icon: string
  color?: undefined | string
  label: string
  callback: ModelIndexActionCallback
  condition?: ModelIndexActionCondition
}

export interface ModelIndexField {
  key: string
  label: string
  formatter: ModelIndexFieldTextFormatter
  align?: 'start' | 'end' | 'center' | undefined
  width?: string | number | undefined
  minWidth?: string | undefined
  maxWidth?: string | undefined
  sortable?: boolean | undefined
  cellProps?: Record<string, any> | undefined
  renderer?: ModelIndexFieldRenderer
}

export interface ModelAddField {
  key: string
  label: string
  validator: ValidationRule
  default: any
  component: 'VTextField' | 'VPasswordField' | 'VAutocomplete' | 'VSwitch'
  bindings: Record<string, any>
}
