<template>
  <img :src="icon" :alt="device" />
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue'
import cameraBatteryFullPng from '../../assets/device-icons/camera.battery.full.png'
import cameraBatteryIconPng from '../../assets/device-icons/camera.battery.icon.png'
import cameraBatteryPosterizedPng from '../../assets/device-icons/camera.battery.posterized.png'
import cameraFloodlightFullPng from '../../assets/device-icons/camera.floodlight.full.png'
import cameraFloodlightIconPng from '../../assets/device-icons/camera.floodlight.icon.png'
import cameraFloodlightPosterizedPng from '../../assets/device-icons/camera.floodlight.posterized.png'
import cameraLegacyFullPng from '../../assets/device-icons/camera.legacy.full.png'
import cameraLegacyIconPng from '../../assets/device-icons/camera.legacy.icon.png'
import cameraLegacyPosterizedPng from '../../assets/device-icons/camera.legacy.posterized.png'
// import cameraWiredFullPng from '../../assets/device-icons/camera.wired.full.png'
// import cameraWiredIconPng from '../../assets/device-icons/camera.wired.icon.png'
// import cameraWiredPosterizedPng from '../../assets/device-icons/camera.wired.posterized.png'
import cameraWiredIndoorFullPng from '../../assets/device-icons/camera.wired.indoor.full.png'
import cameraWiredIndoorIconPng from '../../assets/device-icons/camera.wired.indoor.icon.png'
import cameraWiredIndoorPosterizedPng from '../../assets/device-icons/camera.wired.indoor.posterized.png'
import displayFullPng from '../../assets/device-icons/display.full.png'
import displayIconPng from '../../assets/device-icons/display.icon.png'
import displayPosterizedPng from '../../assets/device-icons/display.posterized.png'
import doorbellBatteryFullPng from '../../assets/device-icons/doorbell.battery.full.png'
import doorbellBatteryIconPng from '../../assets/device-icons/doorbell.battery.icon.png'
import doorbellBatteryPosterizedPng from '../../assets/device-icons/doorbell.battery.posterized.png'
import doorbellLegacyFullPng from '../../assets/device-icons/doorbell.legacy.full.png'
import doorbellLegacyIconPng from '../../assets/device-icons/doorbell.legacy.icon.png'
import doorbellLegacyPosterizedPng from '../../assets/device-icons/doorbell.legacy.posterized.png'
import doorbellWiredFullPng from '../../assets/device-icons/doorbell.wired.full.png'
import doorbellWiredIconPng from '../../assets/device-icons/doorbell.wired.icon.png'
import doorbellWiredPosterizedPng from '../../assets/device-icons/doorbell.wired.posterized.png'

import type { PropType } from 'vue'
export default defineComponent({
  name: 'DeviceIcon',
  props: {
    device: {
      type: String,
      required: true,
    },
    variant: {
      type: String as PropType<'full' | 'icon' | 'posterized'>,
      default: 'icon',
    },
  },
  setup(props) {
    const device = computed(() => props.device)
    const variant = computed(() => props.variant)
    const icon = computed(() => {
      switch (variant.value) {
        case 'full':
          switch (device.value) {
            case 'Nest Cam (outdoor or indoor, battery)':
              return cameraBatteryFullPng
            case 'Nest Cam with floodlight':
              return cameraFloodlightFullPng
            case 'Nest Cam (indoor, wired)':
              return cameraWiredIndoorFullPng
            case 'Nest Hub Max':
              return displayFullPng
            case 'Nest Doorbell (legacy)':
              return doorbellLegacyFullPng
            case 'Nest Doorbell (battery)':
              return doorbellBatteryFullPng
            case 'Nest Doorbell (wired)':
              return doorbellWiredFullPng
            case 'Nest Cam (legacy)':
            default:
              return cameraLegacyFullPng
          }

        case 'posterized':
          switch (device.value) {
            case 'Nest Cam (outdoor or indoor, battery)':
              return cameraBatteryPosterizedPng
            case 'Nest Cam with floodlight':
              return cameraFloodlightPosterizedPng
            case 'Nest Cam (indoor, wired)':
              return cameraWiredIndoorPosterizedPng
            case 'Nest Hub Max':
              return displayPosterizedPng
            case 'Nest Doorbell (legacy)':
              return doorbellLegacyPosterizedPng
            case 'Nest Doorbell (battery)':
              return doorbellBatteryPosterizedPng
            case 'Nest Doorbell (wired)':
              return doorbellWiredPosterizedPng
            case 'Nest Cam (legacy)':
            default:
              return cameraLegacyPosterizedPng
          }

        default:
          switch (device.value) {
            case 'Nest Cam (outdoor or indoor, battery)':
              return cameraBatteryIconPng
            case 'Nest Cam with floodlight':
              return cameraFloodlightIconPng
            case 'Nest Cam (indoor, wired)':
              return cameraWiredIndoorIconPng
            case 'Nest Hub Max':
              return displayIconPng
            case 'Nest Doorbell (legacy)':
              return doorbellLegacyIconPng
            case 'Nest Doorbell (battery)':
              return doorbellBatteryIconPng
            case 'Nest Doorbell (wired)':
              return doorbellWiredIconPng
            case 'Nest Cam (legacy)':
            default:
              return cameraLegacyIconPng
          }
      }
    })
    return {
      icon,
    }
  },
})
</script>
