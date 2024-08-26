# Codec Compatibility

NestMTX is designed with simplicity and broad compatibility in mind. To ensure that streams can be easily integrated into various systems and platforms, all video and audio streams output by NestMTX are encoded using standardized codecs.

## Video Codec

All video streams processed by NestMTX are encoded using the H.264 codec. H.264, also known as AVC (Advanced Video Coding), is widely supported across a broad range of devices, media players, and streaming platforms. This ensures that the video output from NestMTX can be viewed and processed with minimal compatibility concerns, regardless of the source format received from the camera.

## Audio Codec

For audio, NestMTX standardizes on the AAC (Advanced Audio Coding) codec. AAC is a popular and efficient audio codec that offers high-quality sound at lower bitrates, making it ideal for streaming applications. Like H.264, AAC is broadly supported across many devices and platforms, ensuring smooth audio playback without the need for additional transcoding or format conversion.

## Consistent Output

Regardless of the original codec used by the camera, NestMTX will transcode the video to H.264 and the audio to AAC. This consistent output format simplifies integration with other services, such as Frigate and Home Assistant, and ensures that the streams are compatible with a wide array of media players and devices.
