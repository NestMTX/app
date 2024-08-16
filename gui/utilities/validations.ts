import joi from 'joi'
import { tlds } from '@hapi/tlds'
import type { useI18n } from 'vue-i18n'
type I18nT = ReturnType<typeof useI18n>['t']

interface FieldValidationMetaInfo {
  field: string
  name: string
  label?: string
  value: unknown
  form: Record<string, unknown>
  rule?: {
    name: string
    params?: Record<string, unknown> | unknown[]
  }
}

function getJoiResultForVeeValidate<T = any>(
  t: I18nT,
  schema: joi.Schema<T>,
  value: T,
  ctx?: FieldValidationMetaInfo
): string | true {
  const { error } = schema.validate(value)
  if (!ctx) {
    ctx = {
      field: '',
      name: 'generic',
      label: t('fields.generic'),
    } as FieldValidationMetaInfo
  }
  const { field, name, label } = ctx
  const merges = { field, name, label }
  if (!merges.label) {
    merges.label = t(`fields.${merges.name}`)
  }
  if (error) {
    if (Array.isArray(error.details) && error.details.length > 0) {
      return t(`validation.${error.details[0].type}`, merges)
    }
    return t(`validation.valid`, merges)
  }
  return true
}

function getMergesFromCtx(t: I18nT, ctx?: FieldValidationMetaInfo): Record<string, unknown> {
  if (!ctx) {
    ctx = {
      field: '',
      name: 'generic',
      label: t('fields.generic'),
    } as FieldValidationMetaInfo
  }
  const { field, name, label } = ctx
  const merges = { field, name, label }
  if (!merges.label) {
    merges.label = t(`fields.${merges.name}`)
  }
  return merges
}

export interface ValidationRule {
  (t: I18nT, value: unknown, args: unknown[], ctx?: FieldValidationMetaInfo): string | true
}

export const validateName = (t: I18nT, value: string, ctx?: FieldValidationMetaInfo) => {
  const schema = joi
    .string()
    .min(2)
    .max(255)
    .required()
    .alphanum()
    .pattern(/^[0-9]+$/, { invert: true, name: 'alpha' })
  return getJoiResultForVeeValidate(t, schema, value, ctx)
}

export const validateEmail = (t: I18nT, value: string, ctx?: FieldValidationMetaInfo) => {
  const schema = joi
    .string()
    .email({ tlds: { allow: tlds } })
    .required()
  return getJoiResultForVeeValidate(t, schema, value, ctx)
}

export const validatePassword = (t: I18nT, value: string, ctx?: FieldValidationMetaInfo) => {
  const schema = joi.string().min(6).required()
  return getJoiResultForVeeValidate(t, schema, value, ctx)
}

export const validateConfirmPassword = (t: I18nT, value: string, ctx?: FieldValidationMetaInfo) => {
  const schema = joi.string().valid(ctx!.form.password).required()
  const result = getJoiResultForVeeValidate(t, schema, value, ctx)
  if ('string' === typeof result && result === t('validation.valid')) {
    const merges = getMergesFromCtx(t, ctx)
    return t('validation.mismatch', merges)
  }
  return result
}

export const validateAcceptance = (t: I18nT, value: boolean, ctx?: FieldValidationMetaInfo) => {
  const schema = joi
    .boolean()
    .required()
    .custom((v, helpers) => {
      if (!v) {
        return helpers.error('boolean.accepted')
      }
      return v
    }, 'boolean.accepted')
  return getJoiResultForVeeValidate(t, schema, value, ctx)
}

export const validateUsername = (t: I18nT, value: string, ctx?: FieldValidationMetaInfo) => {
  const schema = joi.string().min(3).max(255).required().alphanum()
  return getJoiResultForVeeValidate(t, schema, value, ctx)
}

export const validatorFactory = <ValueType = any>(schema: joi.Schema) => {
  return (t: I18nT, value: ValueType, ctx?: FieldValidationMetaInfo) => {
    return getJoiResultForVeeValidate(t, schema, value, ctx)
  }
}
