# Launching NestMTX with Docker

The easiest & fastest way to deploy NestMTX is using Docker. While it is possible to [build and deploy from source](/installation/source), most users will find that the prepared docker images are more than sufficient for their needs.

## Deployment Channels

NestMTX has been compiled for both `amd64` and `arm64` architecture. This is needed because the binaries for some of the supporting software such as MediaMTX, FFMpeg and GStreamer are different between the different CPU architectures. To reflect this, the images for NestMTX are:

| Arch    | Image           | Docker Hub Link                                                                  |
| ------- | --------------- | -------------------------------------------------------------------------------- |
| `amd64` | `nestmtx/amd64` | [https://hub.docker.com/r/nestmtx/amd64](https://hub.docker.com/r/nestmtx/amd64) |
| `arm64` | `nestmtx/arm64` | [https://hub.docker.com/r/nestmtx/arm64](https://hub.docker.com/r/nestmtx/arm64) |

### Version Tags

In addition to the released versions, there are 2 "main" tags:

* `testing` which receives code updates which are ready to be tested but have not yet been proven stable
* `latest` this is always the latest released version

:::info Example
To use the testing version of `nestmtx/amd64`, you would use the image `nestmtx/amd64:testing`. For the production ready version, you would use either the specific version tag (i.e. `nestmtx/amd64:v1.0.0`) or the `latest` tag (i.e. `nestmtx/amd64:latest`)
:::

## Persistent Volume & Sharing between host and container

There are some situations where you way want to persist files (like the NestMTX SQLite Database) or share files from the host machine to the container (like SSL certificates). NestMTX has a built in directory ready to receive this mapping: `/home/node/app/tmp`.

:::info Example
To map between the `/home/user/nestmtx` directory on your host machine and `/home/node/app/tmp` in the container, add the following before the image name in the command which you use to launch NestMTX:

```bash
-v /home/user/nestmtx:/home/node/app/tmp
```

:::

## Networking Setup

The Networking setup for NestMTX can range between very simplistic to very complex depending on how you would things configured. Without any additional configuration, NestMTX does not expose any ports. Instead it depends on you to configure port mapping as you see fit.

:::info Tip: Avoid Host Networking
NestMTX allocates a LOT of ports for use internally. While it tries to be graceful about conflicts, other applications may not be as flexible. For best results (and for better overall security) it is highly recommended **NOT** to use `--network=host`.
:::

To configure port mapping, add the following before the image name in the command which you use to launch NestMTX:

```bash
-p {port on host}:{port from container}
```

:::info Tip

Some ports are UDP only. The format for mapping those ports is

```bash
-p {port on host}:{port from container}/udp
```

:::

## Web Server(s)

NestMTX serves it's HTTP(s) API on ports `2000` (http) and `2001` (https). **You do not need to expose both of these.**

## Streaming Protocols

By default, NestMTX does not enable any streaming protocols. This is mainly done for performance reasons, but has the additional benefit of helping prevent port conflicts.

### RTSP Output Streaming

To enable an output stream from NestMTX for the **RTSP** Protocol, you should set the environmental variables:

| Environmental Variable   | Value  |
| ------------------------ | ------ |
| `MEDIA_MTX_RTSP_ENABLED` | `true` |

And then forward requests from the host machine to the following ports:

| Port   | Protocol | Use                |
| ------ | -------- | ------------------ |
| `8554` | TCP      | RTSP over TCP      |
| `8000` | UDP      | RTSP over UDP RTP  |
| `8001` | UDP      | RTSP over UDP RTCP |

### RTMP Output Streaming

To enable an output stream from NestMTX for the **RTMP** Protocol, you should set the environmental variables:

| Environmental Variable   | Value  |
| ------------------------ | ------ |
| `MEDIA_MTX_RTMP_ENABLED` | `true` |

And then forward requests from the host machine to the following ports:

| Port | Protocol | Use  |
| ---- | -------- | ---- |
| ``   | TCP      | RTMP |

### HLS Output Streaming

To enable an output stream from NestMTX for the **HLS** Protocol, you should set the environmental variables:

| Environmental Variable  | Value  |
| ----------------------- | ------ |
| `MEDIA_MTX_HLS_ENABLED` | `true` |

And then forward requests from the host machine to the following ports:

| Port | Protocol | Use |
| ---- | -------- | --- |
| ``   | TCP      | HLS |

### WebRTC Output Streaming

To enable an output stream from NestMTX for the **WebRTC** Protocol, you should set the environmental variables:

| Environmental Variable      | Value  |
| --------------------------- | ------ |
| `MEDIA_MTX_WEB_RTC_ENABLED` | `true` |

And then forward requests from the host machine to the following ports:

| Port | Protocol | Use    |
| ---- | -------- | ------ |
| ``   | TCP      | WebRTC |

### SRT Output Streaming

To enable an output stream from NestMTX for the **SRT** Protocol, you should set the environmental variables:

| Environmental Variable  | Value  |
| ----------------------- | ------ |
| `MEDIA_MTX_SRT_ENABLED` | `true` |

And then forward requests from the host machine to the following ports:

| Port | Protocol | Use |
| ---- | -------- | --- |
| ``   | TCP      | SRT |
