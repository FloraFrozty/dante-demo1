import { useEffect, useState } from 'react';
import { BASE_WIDTH, BASE_HEIGHT, SCALE_MIN, SCALE_MAX, CARD_W_BASE, CARD_H_BASE } from '@/component/const/layout';

export function useViewportSize() {
  const [size, setSize] = useState({ w: 1920, h: 1080 });
  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return size;
}

export function useScale() {
  const { w, h } = useViewportSize();
  const raw = Math.min(w / BASE_WIDTH, h / BASE_HEIGHT);
  const scale = Math.max(SCALE_MIN, Math.min(SCALE_MAX, raw));
  const cardW = CARD_W_BASE * scale;
  const cardH = CARD_H_BASE * scale;
  return { scale, cardW, cardH };
}
