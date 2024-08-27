import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "NestMTX",
  description: "Seamlessly Stream Your Nest, Anytime, Anywhere.",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Quick Start', link: '/quickstart' },
    ],

    sidebar: [
      { text: 'Introduction', link: '/introduction' },
      { text: 'Quick Start', link: '/quickstart' },
      { text: 'Design Philosophy', link: '/design-philosophy' },
      { text: 'Releases', link: '/releases' },
      {
        text: 'Compatibility',
        items: [
          { text: 'Device Compatibility', link: '/compatibility/devices' },
          { text: 'Codec Compatibility', link: '/compatibility/codecs' },
          { text: 'Protocol Compatibility', link: '/compatibility/protocols' },
        ],
        collapsed: true
      },
      {
        text: 'Installation',
        items: [
          { text: 'Quick Start', link: '/quickstart' },
          { text: 'Prerequisites', link: '/installation/prerequisites' },
          { text: 'Configuration Options', link: '/installation/configuration' },
          { text: 'Launch with Docker', link: '/installation/docker' },
          { text: 'Launch with Docker Compose', link: '/installation/docker-compose' },
          { text: 'Build from Source', link: '/installation/source' },
        ],
        collapsed: true
      },
      {
        text: 'Usage',
        items: [
          { text: 'Authentication', link: '/setup/authentication' },
          { text: 'Control Panel', link: '/setup/control-panel' },
          { text: 'Credentials', link: '/setup/credentials' },
          { text: 'Cameras', link: '/setup/cameras' },
          { text: 'Cron Jobs', link: '/setup/cronjobs' },
          { text: 'User Management', link: '/setup/users' },
        ],
        collapsed: true
      },
      {
        text: 'APIs',
        items: [
          { text: 'API Basics', link: '/apis/' },
          { text: 'Modules & Methods', link: '/apis/structure' },
          { text: 'HTTP API', link: '/apis/http' },
          { text: 'Socket.IO API', link: '/apis/socket.io' },
          { text: 'MQTT API', link: '/apis/mqtt' },
          { text: 'CLI API', link: '/apis/cli' },
        ],
        collapsed: true
      },
      {
        text: 'Guides',
        items: [
          { text: 'GCP Credentials', link: '/guides/gcp' },
          { text: 'DAC Project ID', link: '/guides/dac' },
          { text: 'Integrations', link: '/integrations/' },
        ],
        collapsed: true
      },
      {
        text: 'Integrations',
        items: [
          { text: 'Frigate', link: '/integrations/frigate' },
          { text: 'Home Assistant', link: '/integrations/hass' },
          { text: 'Blue Iris', link: '/integrations/blue-iris' },
          { text: 'iSpy Agent DVR', link: '/integrations/ispy' },
          { text: 'Node Red', link: '/integrations/node-red' },
        ],
        collapsed: true
      },
      {
        text: 'Bugs & Issues',
        items: [
          { text: 'Open Issues', link: 'https://github.com/NestMTX/app/issues' },
          { text: 'Report an Issue', link: 'https://github.com/NestMTX/app/issues/new' },
          { text: 'Ask the Community', link: 'https://discord.gg/hMAEuNa4Fd' },
        ],
        collapsed: true
      },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/NestMTX' },
      { icon: 'discord', link: 'https://discord.gg/hMAEuNa4Fd' }
    ],

    search: {
      provider: 'local'
    },

    outline: {
      level: [2, 3]
    }
  }
})
