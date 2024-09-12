export const getHardwareAcceleratedDecodingArgumentsFor = (
  hwaccel: string,
  hwaccel_device?: string
): Array<string> => {
  switch (hwaccel.toLowerCase()) {
    case 'nvenc':
    case 'nvdec':
    case 'cuvid':
      return [
        '-hwaccel',
        'cuda',
        '-hwaccel_output_format',
        'cuda',
        ...(hwaccel_device ? ['-gpu', hwaccel_device] : []),
      ]

    case 'vaapi':
      return [
        '-hwaccel',
        'vaapi',
        '-hwaccel_output_format',
        'vaapi',
        ...(hwaccel_device ? ['-vaapi_device', hwaccel_device] : []),
      ]

    case 'qsv':
      return ['-hwaccel', 'qsv']

    case 'amf':
      return ['-hwaccel', 'amf']

    case 'vdpau':
      return ['-hwaccel', 'vdpau']

    case 'videotoolbox':
      return ['-hwaccel', 'videotoolbox']

    default:
      return [] // No hardware acceleration for decoding, use default FFmpeg behavior
  }
}

export const getHardwareAcceleratedEncodingArgumentsFor = (
  hwaccel: string,
  hwaccel_device?: string
): Array<string> => {
  switch (hwaccel.toLowerCase()) {
    case 'nvenc':
      return [
        '-c:v',
        'h264_nvenc',
        ...(hwaccel_device ? ['-gpu', hwaccel_device] : []),
        '-preset',
        'p1',
      ]

    case 'vaapi':
      return [
        '-c:v',
        'h264_vaapi',
        ...(hwaccel_device ? ['-vaapi_device', hwaccel_device] : []),
        '-vf',
        'format=nv12|vaapi,hwupload',
      ]

    case 'qsv':
      return ['-c:v', 'h264_qsv']

    case 'amf':
      return ['-c:v', 'h264_amf']

    case 'vdpau':
      return ['-c:v', 'h264_vdpau']

    case 'videotoolbox':
      return ['-c:v', 'h264_videotoolbox']

    default:
      return ['-c:v', 'libx264'] // Software encoding fallback
  }
}
