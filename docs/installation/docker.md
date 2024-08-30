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
