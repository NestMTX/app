# NestMTX Quickstart

To get started with NestMTX, you have the flexibility to deploy it either as a Docker image or by running it directly from the source code. This quickstart guide focuses on how to deploy NestMTX using Docker, providing examples tailored to different system architectures (`amd64` and `arm64`).

:::info Tip
If you're deploying NestMTX on a Raspberry pi, you're likely going to use the `arm64` image. So will users who are deploying to computers with Apple Silicon processors. Otherwise most users will use the `amd64` version.
:::

NestMTX is designed to handle various streaming protocols and media formats, making it versatile for a range of applications. The following steps outline how to get NestMTX up and running in a Docker environment, ensuring a smooth deployment process.

The commands provided below will:

* Pull the latest NestMTX image for your system's architecture.
* Run the Docker container in detached mode (-d), ensuring that it restarts automatically unless stopped manually (`--restart=unless-stopped`).
* Set up the necessary environment variables and port mappings to ensure that NestMTX can handle your media streaming needs.

Simply copy and paste the relevant command for your system architecture into your terminal, and NestMTX will be up and running in no time.

::: code-group

```bash [amd64]
docker pull nestmtx/amd64:latest
docker run -d \
    --name="nestmtx" \
    --restart=unless-stopped \
    -e RTP_MAX_PORT="10100" \
    -p "2000:2000" \
    -p "2001:2001" \
    -p "1935:1935" \
    -p "8000:8000/udp" \
    -p "8001:8001/udp" \
    -p "8189:8189/tcp" \
    -p "8189:8189/udp" \
    -p "8554:8554" \
    -p "8888:8888" \
    -p "8889:8889" \
    -p "8890:8890" \
    -p "10000-10100:10000-10100/udp" \
    nestmtx/amd64:latest
```

```bash [arm64]
docker pull nestmtx/arm64:latest
docker run -d \
    --name="nestmtx" \
    --restart=unless-stopped \
    -e RTP_MAX_PORT="10100" \
    -p "2000:2000" \
    -p "2001:2001" \
    -p "1935:1935" \
    -p "8000:8000/udp" \
    -p "8001:8001/udp" \
    -p "8189:8189/tcp" \
    -p "8189:8189/udp" \
    -p "8554:8554" \
    -p "8888:8888" \
    -p "8889:8889" \
    -p "8890:8890" \
    -p "10000-10100:10000-10100/udp" \
    nestmtx/arm64:latest
```

:::

:::info Want more options?

For a full list of environmental variables which can be used to configure NestMTX, read the [Configuration Options](/installation/configuration).

:::

:::info Want more details?

For a more detailed breakdown of getting started with NestMTX with Docker, read the [Docker Tutorial](/installation/docker). We also have guides for [Launching with Docker Compose](/installation/-docker-compose) and [Launching from Source](/installation/source).

:::
