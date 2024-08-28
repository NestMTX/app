# Introduction to NestMTX

NestMTX is a service which is meant to help smarthome hobbiests with some technical experience access the feeds from their Google/Nest cameras for use in other services such as [Frigate](https://frigate.video/) and [Home Assistant](https://www.home-assistant.io/). Originally built as just an RTSP server and known as Nest RTSP, NestMTX has grown to support restreaming of Google and Nest Cameras using multiple protocols including:

* RTSP
  * over TCP
  * over UDP using RTP
  * over UDP using RTCP
* RTMP
* HLS
* WebRTC
* SRT

## A word from the Author

> I wanted to take a moment to thank the community of people which has slowly grown around this project. When I started building this tool for myself I never thought that it would garner as much support and interet as it has. While my own needs have alreasy been satisfied, you've given me the opportunity to grow as a developer and contribute back to the community that I have learned so much from already. Thank you for your support and patience.

~ Jak Guru

## How it Works

NestMTX uses Google's Smart Device Management API to generate authenticated feeds and publish them into a local media server based on [MediaMTX](https://github.com/bluenviron/mediamtx). Think of it like a proxy for your Google/Nest Camera RTSP feeds, but which handles automatic reconnection and re-authentication.

## Before you get Started

### Are you getting lost with the technical jargon?

This project may not be for you. While the maintainers of this project are happy to answer questions and troubleshoot any issues which come up, it is assumed that you have either a certain level of technical expertise, or the willingness to take time to research and learn.

### Are you looking for a completely free solution?

This project may not be for you. While this project has been released under the [MIT license](https://github.com/NestMTX/app?tab=MIT-1-ov-file#readme), it uses Google's proprietary [Smart Device Management](https://developers.google.com/nest/device-access) API which requires a non-refundable $5 registration to Google's [Device Access Console](https://console.nest.google.com/device-access/) for usage.

### Are you looking for an Open Source Only project?

This project may not be for you. While this project has been released under the [MIT license](https://github.com/NestMTX/app?tab=MIT-1-ov-file#readme), there may be some libraries, codecs and software running under the hood that are being used under what we interpret as "fair use" policy. We're not lawyers nor do we want to deal with licensing issues, so if you have concerns, please consult with someone who has the requisite credentials and education to give you advice on your usage.

### Are you on a metered or limited bandwidth connection?

This project may not be for you. NestMTX generates a lot of traffic since NestMTX is (for now) unable to communicate directly with Google/Nest Cameras - instead depending on making API requests to Google's [Smart Device Management](https://developers.google.com/nest/device-access) API and retrieving feeds. In simple terms, each camera connects to Google's servers on its own, and then each time you want to stream from one of those cameras, NestMTX will be making a connection to Google's servers.
