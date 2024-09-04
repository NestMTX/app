# Deploying NestMTX with Docker Compose

Using Docker Compose to deploy NestMTX provides an easy way and structured way to manage it. While it's possible to [build and deploy from source](/installation/source), most users will find that the prepared Docker images are more than sufficient for their needs.

:::info Note
This tutorial assumes that you have at least a basic understanding of how to use Docker and Docker Compose.
:::

## Quick Start

NestMTX is designed to handle various streaming protocols and media formats, making it versatile for a range of applications. The following steps outline how to get NestMTX up and running with Docker Compose, ensuring a smooth deployment process.

The provided `docker-compose.yml` file will:

- Configure the necessary environment variables and port mappings to ensure that NestMTX can handle your media streaming needs.
- Set up persistent volumes for data storage.

Simply copy the `docker-compose.yml` example into a new file on your system, adjust the settings as needed, and run the command to bring up the services.

### Example `docker-compose.yml` File

::: code-group

```yaml [amd64]
version: '3.8'

services:
  nestmtx:
    image: nestmtx/amd64:latest
    container_name: nestmtx
    restart: unless-stopped
    environment:
      - RTP_MAX_PORT=10100
      - MEDIA_MTX_RTSP_ENABLED=true
      - MEDIA_MTX_RTMP_ENABLED=true
      - MEDIA_MTX_HLS_ENABLED=true
      - MEDIA_MTX_WEB_RTC_ENABLED=true
      - MEDIA_MTX_SRT_ENABLED=true
    ports:
      - "2000:2000"
      - "2001:2001"
      - "1935:1935"
      - "8000:8000/udp"
      - "8001:8001/udp"
      - "8189:8189/tcp"
      - "8189:8189/udp"
      - "8554:8554"
      - "8888:8888"
      - "8889:8889"
      - "8890:8890"
      - "10000-10100:10000-10100/udp"
    volumes:
      - /home/user/nestmtx:/home/nestmtx/app/tmp
```

```yaml [arm64]
version: '3.8'

services:
  nestmtx:
    image: nestmtx/arm64:latest
    container_name: nestmtx
    restart: unless-stopped
    environment:
      - RTP_MAX_PORT=10100
      - MEDIA_MTX_RTSP_ENABLED=true
      - MEDIA_MTX_RTMP_ENABLED=true
      - MEDIA_MTX_HLS_ENABLED=true
      - MEDIA_MTX_WEB_RTC_ENABLED=true
      - MEDIA_MTX_SRT_ENABLED=true
    ports:
      - "2000:2000"
      - "2001:2001"
      - "1935:1935"
      - "8000:8000/udp"
      - "8001:8001/udp"
      - "8189:8189/tcp"
      - "8189:8189/udp"
      - "8554:8554"
      - "8888:8888"
      - "8889:8889"
      - "8890:8890"
      - "10000-10100:10000-10100/udp"
    volumes:
      - /home/user/nestmtx:/home/nestmtx/app/tmp
```

:::warning IMPORTANT NOTE

Make sure you have the folder permissions setup before using this manifest. See [Folder Permissions](#folder-permissions) for more information.

:::

### Bringing Up the Services

To start the services defined in the `docker-compose.yml` file, navigate to the directory containing the file and run:

```bash
docker-compose up -d
```

This command will pull the required images (if not already available) and start the NestMTX service. The `-d` flag runs the services in detached mode.

## Deployment Channels

NestMTX has been compiled for both `amd64` and `arm64` architecture. This is needed because the binaries for some of the supporting software such as MediaMTX, FFMpeg and GStreamer are different between the different CPU architectures. To reflect this, the images for NestMTX are:

| Arch    | Image           | Docker Hub Link                                                                  |
| ------- | --------------- | -------------------------------------------------------------------------------- |
| `amd64` | `nestmtx/amd64` | [https://hub.docker.com/r/nestmtx/amd64](https://hub.docker.com/r/nestmtx/amd64) |
| `arm64` | `nestmtx/arm64` | [https://hub.docker.com/r/nestmtx/arm64](https://hub.docker.com/r/nestmtx/arm64) |

### Version Tags

In addition to the released versions, there are 2 "main" tags:

- `testing` which receives code updates which are ready to be tested but have not yet been proven stable
- `latest` this is always the latest released version

:::info Example
To use the testing version of `nestmtx/amd64`, you would use the image `nestmtx/amd64:testing`. For the production ready version, you would use either the specific version tag (i.e. `nestmtx/amd64:v1.0.0`) or the `latest` tag (i.e. `nestmtx/amd64:latest`)
:::

## Persistent Volume & Sharing between host and container

There are some situations where you way want to persist files (like the NestMTX SQLite Database) or share files from the host machine to the container (like SSL certificates). NestMTX has a built in directory ready to receive this mapping: `/home/nestmtx/app/tmp`.

:::info Example
To map between the `/home/user/nestmtx` directory on your host machine and `/home/nestmtx/app/tmp` in the container, add the following before the image name in the command which you use to launch NestMTX:

```yaml
volumes:
    - /home/user/nestmtx:/home/nestmtx/app/tmp
```

:::

### Folder Permissions

By default, the `node` user in the docker container has the ID `1000` and the group id `1000`. That means that if your local folder doesn't have very permissive permissions (i.e. `777`) then you will encounter errors when attempting to load NestMTX with a persistent volume. To work around this, there are 2 options:

#### Change the ownership of the folder

You can change the ownership of the folder to `1000:1000` using `chown 1000:1000 /path/to/folder` on the host machine. This will allow the dockerized application to read and write files there without any issues.

#### Change the ID and Group ID of the Docker Container

You can change the ID and Group ID of the docker container by passing the `--user` flag to the command. For example:

:::info Example

```yaml
services:
  nestmtx:
    user: "100:100"
```

:::

If you want to use your own user's ID and Group ID, you can use:

:::info Example

```yaml
services:
  nestmtx:
    user: "${UID}:${GID}"
```

:::

And then you would run:

```bash
UID=$(id -u) GID=$(id -g) docker-compose up
```

## Networking Setup

The Networking setup for NestMTX can range between very simplistic to very complex depending on how you would things configured. Without any additional configuration, NestMTX does not expose any ports. Instead it depends on you to configure port mapping as you see fit.

:::info Tip: Avoid Host Networking
NestMTX allocates a LOT of ports for use internally. While it tries to be graceful about conflicts, other applications may not be as flexible. For best results (and for better overall security) it is highly recommended **NOT** to use `network: host`.
:::

To configure port mapping, add the `ports` property to the `nestmtx` service in your `docker-compose.yml` manifest, and then populate it in `{host machine port}:{container port}` format

:::info Tip

Some ports are UDP only. The format for mapping those ports is `{port on host}:{port from container}/udp`

:::

## Web Server(s)

NestMTX serves it's HTTP(s) API on ports `2000` (http) and `2001` (https).

:::info Tip
You do not need to expose ports for both HTTP and HTTPS. Only expose what you need
:::

### HTTPS

NestMTX serves HTTPS requests with a self-signed certificate which is automatically generated if missing or expired when the container boots. However you are not limited to using the self-signed certificate generated by NestMTX. If you would like to bring your own, you can set the path to the certificate by configuring the `HTTPS_CERT_PATH` and `HTTPS_KEY_PATH` environmental variables.

:::info Tip
If you use a relative file path (i.e. one which doesn't start with `/`) NestMTX assumes that your file path is relative to `/home/app/nestmtx/tmp` so `nestmtx.crt` will be assumed to be `/home/app/nestmtx/tmp/nestmtx.crt`
:::

The easiest way to configure your own SSL certifcates is to map a volume between your host machine and the NestMTX `/home/nestmtx/app/tmp` directory, place your certificate and certificate key files in the folder on your host machine, and configure the `HTTPS_CERT_PATH` and `HTTPS_KEY_PATH` appropriately.

## Database

NestMTX is configured by default to use an SQLite database which is generated and stored in `/home/nestmtx/app/tmp/db.sqlite3`, however you are able to use your own custom database server including:

- MySQL / MariaDB
- PostgreSQL<sup>1</sup>
- Microsoft SQL

<small><sup>1</sup> While the driver technically supports Amazon Redshift, it is not recommended to use it.</small>

### Configuring a Custom Database

To configure a custom database, you will need to configure the following environmental variables:

| Environmental Variable | Options                          | Description                                                                      |
| ---------------------- | -------------------------------- | -------------------------------------------------------------------------------- |
| `DB_CONNECTION`        | `sqlite`, `mysql`, `pg`, `mssql` | The type of database which NestMTX will use                                      |
| `DB_HOST`              |                                  | The IP address or hostname of the database server NestMTX will use               |
| `DB_PORT`              |                                  | The port which the database server is listening for connections on               |
| `DB_USER`              |                                  | The user NestMTX will use to authenticate connections to the database server     |
| `DB_PASSWORD`          |                                  | The password NestMTX will use to authenticate connections to the database server |
| `DB_NAME`              |                                  | The name of the database NestMTX will connect to on the database server          |
| `DB_SECURE`            | `true`, `false`                  | If NestMTX needs to attempt a secure connection to the database server           |

:::info Tip
In most cases in a home lab, you will not need to configure `DB_SECURE`, but if you're using a Cloud-managed database server from providers like AWS or DigitalOcean you will most likely need to set this to `true`.
:::

## MQTT

NestMTX supports many programmatic methods of control including an [MQTT API](/apis/mqtt). Without any additional configuration, NestMTX launches its own built-in MQTT server using [Aedes](https://github.com/moscajs/aedes#readme), but it can be configured to use an external MQTT server as well.

### NestMTX Topics

NestMTX nests all topics under the topic defined by the `MQTT_BASE_TOPIC` environmental variable. By default, it is set to `nestmtx`, but you can change it to anything that you would like! For more information on how topics are used, please see the [MQTT API documentation](/apis/mqtt).

### NestMTX MQTT

To use the NestMTX MQTT Server, you will need to forward requests from the host machine to the port configured under the environmental variable `MQTT_PORT`. This port is set to `1883` by default.

:::info Example

```yaml
ports:
    1883:1883
```

:::

### External MQTT Server

You can use an external MQTT Server with NestMTX by setting the following environmental variables:

| Environmental Variable | Options                                                       | Description                                                        |
| ---------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------ |
| `MQTT_PROTOCOL`        | `wss`,`ws`,`mqtt`,`mqtts`,`tcp`,`ssl`,`wx`,`wxs`,`ali`,`alis` | The protocol used to connect to the MQTT Server                    |
| `MQTT_HOST`            |                                                               | The IP address or hostname of the MQTT Server                      |
| `MQTT_PORT`            |                                                               | The port the MQTT server is listening for connections on           |
| `MQTT_USER`            |                                                               | The username used to authenticate connections with the MQTT server |
| `MQTT_PASS`            |                                                               | The password used to authenticate connections with the MQTT server |

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

| Port   | Protocol | Use  |
| ------ | -------- | ---- |
| `1935` | TCP      | RTMP |

### HLS Output Streaming

To enable an output stream from NestMTX for the **HLS** Protocol, you should set the environmental variables:

| Environmental Variable  | Value  |
| ----------------------- | ------ |
| `MEDIA_MTX_HLS_ENABLED` | `true` |

And then forward requests from the host machine to the following ports:

| Port   | Protocol | Use |
| ------ | -------- | --- |
| `8888` | TCP      | HLS |

### WebRTC Output Streaming

To enable an output stream from NestMTX for the **WebRTC** Protocol, you should set the environmental variables:

| Environmental Variable      | Value  |
| --------------------------- | ------ |
| `MEDIA_MTX_WEB_RTC_ENABLED` | `true` |

And then forward requests from the host machine to the following ports:

| Port   | Protocol | Use        |
| ------ | -------- | ---------- |
| `8889` | TCP      | WebRTC     |
| `8189` | UDP      | WebRTC UDP |

### SRT Output Streaming

To enable an output stream from NestMTX for the **SRT** Protocol, you should set the environmental variables:

| Environmental Variable  | Value  |
| ----------------------- | ------ |
| `MEDIA_MTX_SRT_ENABLED` | `true` |

And then forward requests from the host machine to the following ports:

| Port   | Protocol | Use |
| ------ | -------- | --- |
| `8890` | TCP      | SRT |

## Support for WebRTC Cameras

NestMTX works with WebRTC Cameras out of the box, but in order to enable you will need to open some UDP ports to enable the receipt of the RTP packets which make up the feed.
This can be configured with the `WEBRTC_RTP_MIN_PORT` and `WEBRTC_RTP_MAX_PORT` environmental variables.

Once you have your minimum and maximum RTP ports set, you'll need to forward them like this:

```yaml
ports:
    "10000-10100:10000-10100/udp"
```

:::info Note

This example is opening 100 ports, where `WEBRTC_RTP_MIN_PORT` = `10000` and `WEBRTC_RTP_MAX_PORT` = `10100`. You can open more, or less, but be aware that Docker's support for port ranges can be slow, especially for large ranges.

:::

### How many ports do I need open?

The basic math is quite simple: you need 2 ports for every WebRTC camera which you would like to simultanously stream. However it is recommend that you double that in order to have a few extra ports available for things like quick reconnections or other potential issues. *You have 65,535 per network interface, you don't need to be stingy.*

### Using Twilio ICE Servers

In WebRTC, ICE (Interactive Connectivity Establishment) is a crucial protocol responsible for finding the best path to connect peers (e.g., cameras and viewers) across potentially complex networks, such as those behind NATs (Network Address Translators) or firewalls. ICE servers help in gathering the potential connection candidates (like IP addresses and ports) and testing them to establish a direct and optimal peer-to-peer connection.

Twilio is one of the largest communication API platforms today, renowned for its robust infrastructure and reliable services. To support their own video conferencing solutions based on WebRTC, Twilio offers very stable and high-performance servers, including ICE servers, which can be leveraged by NestMTX.

:::info Important Note
In order to use Twilio's ICE Servers, you will need to register an account. You can register an account with Twilio [through their registration page](https://www.twilio.com/try-twilio).
:::

To configure NestMTX to utilize Twilio's ICE servers, you will need to configure the following environmental variables:

| Environmental Variable  | Description                                                              |
| ----------------------- | ------------------------------------------------------------------------ |
| `TWILIO_ACCOUNT_SID`    | Your Twilio **Account** SID                                              |
| `TWILIO_API_KEY_SID`    | The SID of the Twilio API Key which you are configuring for NestMTX      |
| `TWILIO_API_KEY_SECRET` | The secret of the Twilio API Key which you are configuring for NestMTX   |
| `ICE_USE_TWILIO`        | `true` or `false` to indicate if NestMTX should use Twilio's ICE servers |

### Configuring NAT

Network Address Translation (NAT) is a critical part of the WebRTC protocol. In order to faciliate connections from Google's servers, your public IP address needs to be resolved and then shared with any potential peer connections. NestMTX can be configured to resolve your public IP address by using either a cloud service resolver, or to use a static value that you configure.

#### Configuring Cloud Resolvers

You can configure the `IP_RESOLVERS_ENABLED` environmental variable as a comma seperated list of one of the following values:

- `google`
- `cloudflare`
- `aws`
- `akamai`
- `ipify`
- `ifconfigMe`
- `ipEchoNet`
- `ipInfoIo`
- `httpBin`

:::info Example

```yaml
environment:
    - IP_RESOLVERS_ENABLED="cloudflare,aws,httpBin"
```

:::

NestMTX will attempt to cascade through the providers to determine your public IP address until it receives a valid response.

#### Manually Setting your Public IP

You can also tell NestMTX what your public IP is using the `IP_PUBLIC_RESOLVED` environmental variable. This is useful for those of you with privacy concerns.

#### Setting your LAN IP

If you're having trouble with your WebRTC cameras, it may be beneficial to also configure the `IP_LAN_RESOLVED` environmental variable with the IP address of the host machine which NestMTX is running on.

## Logs and Log Levels

NestMTX uses [pino](https://getpino.io/#/) for logging and strives to include useful information in the logs based on the service generating them. You can control the verbosity of the logs by setting the `LOG_LEVEL` environmental variable to one of the following levels:

- **`trace`**: The most detailed level of logging. `Trace` logs capture every detail about the application's operation, including fine-grained information like variable values and method entries. This level is typically used during development or for troubleshooting specific issues.
  
- **`debug`**: `Debug` logs provide detailed insights into the application's flow and state, helpful for diagnosing issues. This level is less granular than `trace` but still offers significant detail. It is commonly used in development or testing environments to understand how the code is functioning.

- **`info`**: `Info` logs provide general information about the normal operation of the application, such as task completions, state changes, or significant events. This level is suitable for production to monitor the application's standard behavior.

- **`warn`**: `Warn` logs indicate that something unexpected occurred, or a potential issue was detected, but the application continues to function normally. These logs highlight situations that may require attention but are not critical.

- **`error`**: `Error` logs capture serious issues where the application encountered a problem it couldn't recover from, though it may still be running. This level is used for logging critical issues that require immediate attention.

- **`fatal`**: The most severe level, `fatal` logs indicate a critical error that forces the application to terminate. These logs are essential for understanding catastrophic failures that prevent the application from continuing.
