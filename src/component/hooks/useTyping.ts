import { useEffect, useState } from 'react';
import { TYPING } from '@/component/const/layout';

export function useTyping(result: string | null) {
  const [typed, setTyped] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isWaitingToType, setIsWaitingToType] = useState(false);
  const [ellipsis, setEllipsis] = useState(0);

  useEffect(() => {
    if (!result) return;
    let cancelled = false;
    let startTimer: number | undefined;
    let tickTimer: number | undefined;

    setIsWaitingToType(true);
    setIsTyping(false);
    setTyped('');

    const beginTyping = () => {
      if (cancelled) return;
      setIsWaitingToType(false);
      setIsTyping(true);

      let i = 0;
      const tick = () => {
        if (cancelled) return;
        if (i >= result.length) { setIsTyping(false); return; }
        const ch = result[i++];
        setTyped(prev => prev + ch);

        const isPunct = /[.,!?…]/.test(ch);
        const delay =
          TYPING.BASE_MS +
          Math.random() * TYPING.VARIANCE_MS +
          (isPunct ? TYPING.PUNCT_PAUSE_MS : 0);

        tickTimer = window.setTimeout(tick, delay);
      };
      tickTimer = window.setTimeout(tick, TYPING.BASE_MS);
    };

    startTimer = window.setTimeout(beginTyping, TYPING.START_DELAY_MS);
    return () => {
      cancelled = true;
      if (startTimer) clearTimeout(startTimer);
      if (tickTimer) clearTimeout(tickTimer);
    };
  }, [result]);

  useEffect(() => {
    if (!isWaitingToType) return;
    setEllipsis(0);
    const id = setInterval(() => setEllipsis(prev => (prev + 1) % 4), 400);
    return () => clearInterval(id);
  }, [isWaitingToType]);

  const skipTyping = () => {
    if (isTyping && result) {
      setTyped(result);
      setIsTyping(false);
      setIsWaitingToType(false);
    }
  };

  return { typed, isTyping, isWaitingToType, ellipsis, skipTyping };
}