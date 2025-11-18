import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { MIN_BOOT_MS, TUTORIAL_COOKIE } from '@/component/const/layout';
import { preloadImage } from '@/component/utils/assets';
import { shuffleArray } from '@/component/utils/shuffle';
import { CARD_NAMES } from '@/component/const/tarot';

export function useBoot() {
  const [isBooting, setIsBooting] = useState(true);
  const [agreed, setAgreed] = useState(false);
  const [tutorialSeen, setTutorialSeen] = useState(false);
  const [deck, setDeck] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    const boot = async () => {
      const accepted = Cookies.get('dante_agreed') === 'true';
      if (accepted) setAgreed(true);
      const tutSeen = Cookies.get(TUTORIAL_COOKIE) === 'true';
      setTutorialSeen(tutSeen);

      const preloadTasks = [
        preloadImage('/tarot/table.png'),
        preloadImage('/tarot/back.jpg'),
        preloadImage('/tarot/dante.PNG')
      ];

      setDeck(shuffleArray(CARD_NAMES));

      await Promise.all([Promise.all(preloadTasks), new Promise(r => setTimeout(r, MIN_BOOT_MS))]);
      if (!cancelled) setIsBooting(false);
    };
    boot();
    return () => { cancelled = true; };
  }, []);

  return { isBooting, agreed, setAgreed, tutorialSeen, setTutorialSeen, deck, setDeck };
}
