export const getUrlObjectForRtspUrl = (rtspUrl: string): URL => {
  const urlString = rtspUrl.replace('rtsp://', 'http://').replace('rtsps://', 'https://')
  return new URL(urlString)
}

export const getHostnameFromRtspUrl = (rtspUrl: string): string => {
  const url = getUrlObjectForRtspUrl(rtspUrl)
  return url.hostname
}
