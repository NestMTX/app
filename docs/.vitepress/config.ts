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
      { text: 'Acknowledgements', link: '/acknowledgements' },
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
          {
            text: 'DVRs & NVRs',
            items: [
              { text: 'Frigate', link: '/integrations/frigate' },
              { text: 'Home Assistant', link: '/integrations/hass' },
              { text: 'Blue Iris', link: '/integrations/blue-iris' },
              { text: 'iSpy Agent DVR', link: '/integrations/ispy' },
              { text: 'Scrypted', link: '/integrations/scrypted' },
              { text: 'Shinobi', link: '/integrations/shinobi' },
              { text: 'Zoneminder', link: '/integrations/zoneminder' },
            ],
            collapsed: true
          },
          {
            text: 'Automation Platforms',
            items: [
              { text: 'Home Assistant', link: '/integrations/hass' },
              { text: 'Node Red', link: '/integrations/node-red' },
            ],
            collapsed: true
          },
          {
            text: 'Other Applications',
            items: [
              { text: 'FFMpeg', link: '/integrations/ffmpeg' },
              { text: 'GStreamer', link: '/integrations/gstreamer' },
              { text: 'MediaMTX', link: '/integrations/mediamtx' },
              { text: 'Go2RTC', link: '/integrations/go2rtc' },
              { text: 'OBS', link: '/integrations/obs' },
              { text: 'VLC', link: '/integrations/vlc' },
            ],
            collapsed: true
          },
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
      { text: 'Disclaimer', link: '/disclaimer' },
      { text: 'MIT License', link: 'https://github.com/NestMTX/app?tab=MIT-1-ov-file#readme' },
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
    },

    footer: {
      message: 'Released under the <a href="https://github.com/NestMTX/app?tab=MIT-1-ov-file#readme">MIT License</a>.',
      copyright: 'Copyright © 2022-present <a href="https://github.com/jakguru">Jak Guru</a>'
    }
  },
  lastUpdated: true,

  head: [
    ['meta', { charset: 'utf-8' }],
    ['meta', { name: 'viewport', content: 'width=device-width, initial-scale=1' }],
    ['meta', { name: 'msapplication-TileColor', content: '#b2d7ff' }],
    ['meta', { name: 'theme-color', content: '#b2d7ff' }],
    ['link', { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }],
    ['link', { rel: 'apple-touch-icon', sizes: '57x57', href: '/apple-touch-icon-57x57.png' }],
    ['link', { rel: 'apple-touch-icon', sizes: '60x60', href: '/apple-touch-icon-60x60.png' }],
    ['link', { rel: 'apple-touch-icon', sizes: '72x72', href: '/apple-touch-icon-72x72.png' }],
    ['link', { rel: 'apple-touch-icon', sizes: '76x76', href: '/apple-touch-icon-76x76.png' }],
    ['link', { rel: 'apple-touch-icon', sizes: '114x114', href: '/apple-touch-icon-114x114.png' }],
    ['link', { rel: 'apple-touch-icon', sizes: '120x120', href: '/apple-touch-icon-120x120.png' }],
    ['link', { rel: 'apple-touch-icon', sizes: '144x144', href: '/apple-touch-icon-144x144.png' }],
    ['link', { rel: 'apple-touch-icon', sizes: '152x152', href: '/apple-touch-icon-152x152.png' }],
    ['link', { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon-180x180.png' }],
    ['link', { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' }],
    ['link', { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' }],
    ['link', { rel: 'manifest', href: '/site.webmanifest' }],
    ['link', { rel: 'mask-icon', href: '/safari-pinned-tab.svg', color: '#5bbad5' }],
  ],
})
