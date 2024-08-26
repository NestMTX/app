# Pre-requisites for Installation

Before installing NestMTX, it’s important to ensure that you have the necessary credentials and tools ready to facilitate a smooth setup process.

## Recommended Credentials

While not strictly required for installation, having the following credentials prepared will streamline the setup and configuration of NestMTX:

- **Google Cloud Platform OAuth Credentials**: Required to authenticate with Google services.
- **Device Access Console Project ID**: Necessary for managing and accessing devices through the Google Smart Device Management API.

These credentials are essential for setting up device access and ensuring that your Google/Nest cameras are correctly integrated with NestMTX.

## Optional Configurations

NestMTX offers several optional configurations to enhance its functionality. To take full advantage of these features, you will need to configure the relevant credentials:

- **Custom Database**: If you want to use a custom database, you’ll need the appropriate credentials for database access.
- **MQTT API Support**: For users intending to use MQTT for event handling and notifications, ensure that your MQTT broker credentials are configured.
- **Twilio for ICE**: If you plan to use Twilio for ICE (Interactive Connectivity Establishment) in WebRTC, you’ll need your Twilio account credentials.

## Installation from Source

If you choose to install and run NestMTX from source, the following software is required:

- **Node.js**: Node.js `v21.x` is required to run NestMTX. Ensure that it is installed and properly configured on your system.
- **GStreamer**: `gst-launch-1.0` is needed for managing media streams, especially for WebRTC connections. Specifically, you’ll need GStreamer with support for the following elements:
  - `udpsrc`, `rtpjitterbuffer`, `rtph264depay`, `h264parse`, `opusdec`, `audioconvert`, `avenc_aac`, `rtspclientsink`
- **FFmpeg**: FFmpeg is used for handling and transcoding media streams, particularly for RTSP connections. Ensure that FFmpeg is installed with support for the following codecs and features:
  - `libx264` for H.264 video encoding
  - `aac` for AAC audio encoding
  - Other required features include support for `rtsp`, `tcp`, `udp`, and low-latency streaming.
