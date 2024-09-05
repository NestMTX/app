/**
 * This is a special configuration file meant to help generate alternative
 * dropcam RTSPS URLs. This is specifically called for because Google's servers
 * are not always reliable and may not always be able to provide a stream.
 */
import env from '#start/env'

const DROPCAM_EXCLUDED_DATACENTERS = [
  // nothing here for now except what is pulled from the env
  ...env
    .get('DROPCAM_EXCLUDED_DATACENTERS', '')
    .split(',')
    .filter((s) => 'string' === typeof s && s.length > 0)
    .map((s) => s.trim().toLowerCase())
    .filter((s) => 'string' === typeof s && s.length > 0),
]
const DROPCAM_EXCLUDED_PHONETICS = [
  // nothing here for now except what is pulled from the env
  ...env
    .get('DROPCAM_EXCLUDED_PHONETICS', '')
    .split(',')
    .filter((s) => 'string' === typeof s && s.length > 0)
    .map((s) => s.trim().toLowerCase())
    .filter((s) => 'string' === typeof s && s.length > 0),
]
const DROPCAM_EXCLUDED_DATACENTER_ZONES = [
  // nothing here for now except what is pulled from the env
  ...env
    .get('DROPCAM_EXCLUDED_DATACENTER_ZONES', '')
    .split(',')
    .filter((s) => 'string' === typeof s && s.length > 0)
    .map((s) => s.trim().toLowerCase())
    .filter((s) => 'string' === typeof s && s.length > 0),
]
const DROPCAM_EXCLUDED_HOSTNAMES = [
  // nothing here for now except what is pulled from the env
  ...env
    .get('DROPCAM_EXCLUDED_HOSTNAMES', '')
    .split(',')
    .filter((s) => 'string' === typeof s && s.length > 0)
    .map((s) => s.trim().toLowerCase())
    .filter((s) => 'string' === typeof s && s.length > 0),
]

export const dropcamDataCenters: Readonly<Array<string>> = ['eu', 'uc', 'ue', 'us']
  .map((v) => v.toLowerCase())
  .filter((v) => !DROPCAM_EXCLUDED_DATACENTERS.includes(v))
export const dropcamPhonetics: Readonly<Array<string>> = [
  'alfa',
  'bravo',
  'charlie',
  'delta',
  'foxtrot',
]
  .map((v) => v.toLowerCase())
  .filter((v) => !DROPCAM_EXCLUDED_PHONETICS.includes(v))
export const dropcamMaxDatacenterZones: Readonly<number> = 4

const dropcamPossibleHostnamesSet: Set<string> = new Set()

dropcamPhonetics.forEach((p) => {
  dropcamPossibleHostnamesSet.add(`stream-${p}.dropcam.com`)
  dropcamDataCenters.forEach((d) => {
    for (let i = 1; i <= dropcamMaxDatacenterZones; i++) {
      if (DROPCAM_EXCLUDED_DATACENTER_ZONES.includes(`${i}`)) {
        continue
      }
      dropcamPossibleHostnamesSet.add(`stream-${p}-${d}${i}.dropcam.com`)
    }
  })
})

export const dropcamPossibleHostnames: Readonly<Array<string>> = [...dropcamPossibleHostnamesSet]
  .map((v) => v.toLowerCase())
  .filter((v) => !DROPCAM_EXCLUDED_HOSTNAMES.includes(v))

export const dropcamRetryHostnameFailureMessages: Readonly<Array<string>> = [
  'An error was encountered while discovering the file',
  'Analyzing URI timed out',
]

/**
 * Freeze the configuration objects to prevent further modification.
 */
Object.freeze(dropcamDataCenters)
Object.freeze(dropcamPhonetics)
Object.freeze(dropcamPossibleHostnames)
Object.freeze(dropcamMaxDatacenterZones)
Object.freeze(dropcamRetryHostnameFailureMessages)
