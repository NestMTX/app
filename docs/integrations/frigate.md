# Using NestMTX as a feed source for Frigate

[Frigate](https://frigate.video) is a complete and local NVR designed for Home Assistant with AI object detection. Uses OpenCV and Tensorflow to perform realtime object detection locally for IP cameras.

NestMTX was designed primarily with integration with Frigate in mind. Specifially, it ensures that feeds are output using H.254 encoded video tracks, and AAC encoded audio tracks. And while NestMTX is compatible with the majority of the protocols which Frigate is able to work with, it is recommended to use the RTSP protocol.

:::info Note

This tutorial assumes that you have NestMTX running at the hostname `my.nestmtx.local`, has enabled RTSP feeds, and has been setup to listen for RTSP connections on port `8554`.

:::

:::warning Important Note

This tutorial assumes that you are running Frigate version `0.14.x`. While this tutorial may also work for previous versions, we do not have confirmation at this time of it working with previous versions.

:::

## Basic Camera Configuration

The following example is the most basic camera configuration for integrating a NestMTX feed into Frigate:

```yaml
My_NestMtx_Camera:
    enabled: true
    ffmpeg:
      input_args: preset-rtsp-restream
      inputs:
        - path: rtsp://my.nestmtx.local:8554/my_nestmtx_camera
          roles:
            - detect
            - record
            - audio # for audio detection
```

:::info Note

The `preset-rtsp-restream` ffmpeg preset was chosen due to its overall stability and compatibility.

:::

## Setting Resolution

NestMTX is able to detect the camera stream resolution from the camera's API properties. Because this information is known in advance you can configure Frigate to use this resolution by default instead of having it try to determine the correct resolution. This is done by configuring the `detect` property of the camera. For example:

```yaml
My_NestMtx_Camera:
    enabled: true
    ffmpeg:
      input_args: preset-rtsp-restream
      inputs:
        - path: rtsp://my.nestmtx.local:8554/my_nestmtx_camera
          roles:
            - detect
            - record
            - audio # for audio detection
    detect:
        width: 640
        height: 480
```
