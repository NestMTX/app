# Protocol Compatibility

NestMTX is designed to offer flexible streaming options, supporting a wide range of protocols thanks to its foundation on MediaMTX. This ensures that your streams can be accessed and integrated into various systems using the protocol that best suits your needs. All streams are output using H.264 for video and AAC for audio, providing consistent compatibility across different platforms and devices.

## Supported Protocols

The following table outlines the protocols supported by NestMTX, specifically showing the supported codecs for the output streams:

| Protocol   | Variants                | Video Codecs | Audio Codecs |
| ---------- | ----------------------- | ------------ | ------------ |
| **SRT**    | -                       | H264         | AAC          |
| **WebRTC** | Browser-based, WHEP     | H264         | AAC          |
| **RTSP**   | UDP, UDP-Multicast, TCP | H264         | AAC          |
| **RTMP**   | RTMP,  Enhanced RTMP    | H264         | AAC          |
| **HLS**    | Low-Latency HLS         | H264         | AAC          |

## Consistent Output

Regardless of the protocol or variant used, NestMTX ensures that all streams are consistently output in H.264 for video and AAC for audio. This standardization simplifies integration with various systems and ensures high compatibility with media players, streaming platforms, and other smart home services like Frigate and Home Assistant.
