export const isDesktopUA = () =>
  typeof window !== 'undefined' && !/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);