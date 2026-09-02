export {}

declare global {
  interface Window {
    naver?: { maps: any }
    navermap_authFailure?: () => void
  }
}
