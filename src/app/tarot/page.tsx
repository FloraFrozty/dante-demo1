'use client';

// Imports from plugins and libraries
import { useState, useEffect, useRef } from 'react';
import axios/*, { spread }*/ from 'axios';
import { motion, AnimatePresence } from "motion/react";
// import { animate } from 'animejs';
import { Brain, CalendarClock, Lightbulb, Sparkle, X, Sprout } from "lucide-react";
import Cookies from "js-cookie";

// Imports from local data files
import tarot from '@/data/tarot.json';

// Data type: New Tarot JSON format
type TarotCardRaw = {
  fileName?: string;
  name?: string;
  keywords?: string[];
  short_meaning?: string[];
  general?: {
    visual_description?: string;
    meaning?: string;
    reversed_meaning?: string;
  };
  interpretation?: string;
  upright?: {
    daily?: string;
  };
};

// Data type: Initial Tarot JSON format
type TarotCardInfo = {
  displayName: string;
  keywords: string[];
  generalText: string; // joined paragraphs with blank line between
};

// URL CONFIG
const URL_CONFIG = {
  url: process.env.NEXT_PUBLIC_APP_BASE_URL ?? 'http://localhost:8080'
};


const asset = (p: string) => `${p}`;

// Utility to shuffle an array
function shuffleArray<T>(array: T[]): T[] {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  // console.log(a)
  return a;
}

// const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// [ADDED] Small hook to track viewport size (desktop+tablet only use)
function useViewportSize() {
  // [COMMENT] We only need width/height to compute responsive scale
  const [size, setSize] = useState({ w: 1920, h: 1080 });
  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    onResize(); // initialize
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return size;
}

export default function Home() {

  // [ADDED] ── Base design canvas and scaling clamps
  // [COMMENT] At 1920x1080 → scale = 1 (preserves current size).
  //           Below that, we downscale; above, we cap at SCALE_MAX=1 to keep same size.
  const BASE_WIDTH = 1920;     // [COMMENT] design-time width (px)
  const BASE_HEIGHT = 1080;    // [COMMENT] design-time height (px)
  const SCALE_MIN = 0.70;      // [COMMENT] don't shrink below 70% for tablets (tweakable)
  const SCALE_MAX = 1.00;      // [COMMENT] keep current size on big monitors

  // [ADDED] read viewport and compute scale
  const { w: vpW, h: vpH } = useViewportSize();
  // [COMMENT] Fit by the smaller ratio so the deck always fully fits the base canvas aspect
  const rawScale = Math.min(vpW / BASE_WIDTH, vpH / BASE_HEIGHT);
  // [COMMENT] Clamp final scale for tablet/desktop
  const scale = Math.max(SCALE_MIN, Math.min(SCALE_MAX, rawScale));

  // [ADDED] compute scaled card size once per render
  const CARD_W_BASE = 112;               // [COMMENT] matches w-28 (7rem @16px)
  const CARD_H_BASE = 192;               // [COMMENT] matches h-48 (12rem @16px)
  const cardW = CARD_W_BASE * scale;
  const cardH = CARD_H_BASE * scale;


  // Arc-related variables → now scale-aware while preserving geometry
  const maxAngle = 90;                 // [COMMENT] total spread in degrees (unchanged)
  const RADIUS_BASE = -950;            // [COMMENT] design-time radius (px), negative bends upward
  const radius = RADIUS_BASE * scale;  // [COMMENT] scaled radius keeps same look on smaller screens

  // Common offsets used in positioning (scaled)
  const CENTER_X_PCT = 46.25;          // [COMMENT] horizontal anchor (% of viewport width); keep %
  const ARC_Y_ANCHOR_BASE = -300;      // [COMMENT] design-time vertical anchor (px)
  const ARC_Y_ANCHOR = ARC_Y_ANCHOR_BASE * scale;

  const SELECT_LIFT_BASE = -80;        // [COMMENT] selected card vertical lift (px)
  const SELECT_LIFT = SELECT_LIFT_BASE * scale;

  const CENTER_SHIFT_K_BASE = 1.9;     // [COMMENT] selected card extra side-shift vs center
  const CENTER_SHIFT_K = CENTER_SHIFT_K_BASE * scale;

  const maxRange = 20;                 // [COMMENT] how many neighbors feel the ripple (unchanged count)
  const HOVER_PUSH_BASE = 10;          // [COMMENT] hover shove magnitude (px)
  const SELECT_PUSH_BASE = 100;        // [COMMENT] neighbor shove when a different card is selected (px)
  const SELF_SELECTED_PUSH_BASE = 50;  // [COMMENT] shove used when the card itself is selected (px)

  // [COMMENT] Uses scaled `radius`, so x/y offsets scale perfectly with viewport
  function computeCardPosition(i: number, deckLength: number) {
    const t = deckLength > 1 ? i / (deckLength - 1) : 0.5;   // [COMMENT] even spread 0..1
    const angle = (t - 0.5) * maxAngle;                      // [COMMENT] map to -max/2 .. +max/2
    const rad = (angle * Math.PI) / 180;                     // [COMMENT] radians for trig
    const xOffset = Math.sin(rad) * radius;                  // [COMMENT] horizontal arc offset (scaled)
    const yOffset = radius - Math.cos(rad) * radius;         // [COMMENT] vertical arc rise (scaled)
    return { angle, rad, xOffset, yOffset };
  }

  // State for deck order, selected cards, and question text
  const [deck, setDeck] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [question, setQuestion] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState('');
  const [stage/*, setStage*/] = useState<'select' | 'reveal'>('select');
  const [hovered, setHovered] = useState<number | null>(null);
  const [cursorAngle, setCursorAngle] = useState(0);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [submittedQuestion, setSubmittedQuestion] = useState<string | null>(null);
  const [showDeck, setShowDeck] = useState(true);
  const [shuffleDeck, setShuffleDeck] = useState(true);
  const [agreed, setAgreed] = useState(false);
  const [openCard, setOpenCard] = useState<string | null>(null);
  const [postReveal, setPostReveal] = useState(false);
  const [pendingSpread, setPendingSpread] = useState<SpreadType>(null);
  const [showSpreadConfirm, setShowSpreadConfirm] = useState(false);
  const [tempQuestion, setTempQuestion] = useState('');

  type SpreadType = 'daily' | 'yesno' | 'celtic_cross' | 'three_card_basic' | 'three_card_cause_effect' | null;
  const SPREAD_META = {
    daily: { picks: 1, requiresQuestion: false, label: 'Daily Vibes' },
    yesno: { picks: 1, requiresQuestion: false, label: 'Yes.. No.. Or Maybe?' },
    celtic_cross: { picks: 10, requiresQuestion: false, label: 'Celtic Cross Tarot Reading' },
    three_card_basic: { picks: 3, requiresQuestion: false, label: 'Past, Present, and Future' },
    three_card_cause_effect: { picks: 3, requiresQuestion: false, label: 'Cause & Result' }
  } as const;

  const [spreadType, setSpreadType] = useState<SpreadType>(null);

  const TYPE_BASE_MS = 28;        // base per-char speed
  const TYPE_VARIANCE_MS = 12;    // randomness
  const PUNCT_PAUSE_MS = 180;     // extra pause after . , ! ? …

  const TYPING_DELAY_MS = 3000; // 3s

  const [typed, setTyped] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isWaitingToType, setIsWaitingToType] = useState(false);
  const [ellipsis, setEllipsis] = useState(0);

  // [ADDED] Thinking indicator (before any result exists)
  const [thinkingDots, setThinkingDots] = useState(0);

  // [ADD] Global boot flag
  const [isBooting, setIsBooting] = useState(true);

  // [ADD] Tutorial state
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [tutorialIndex, setTutorialIndex] = useState(0);
  const [tutorialSeen, setTutorialSeen] = useState(false);

  const [showReveal, setShowReveal] = useState(true);

  // [ADDED] Derived status flags
  const isThinking = loading && hasSubmitted && stage === 'select' && !showDeck && !shuffleDeck;

  const statusEmote = isThinking
    ? '/customEmote/thinking.png'         // show placeholder while thinking
    : isWaitingToType
      ? '/customEmote/sniff.png'            // optional: add this asset
      : '/customEmote/elegant.png';          // after typing finishes (success/ready)


  const getCardInfo = (n: string): TarotCardInfo | undefined => {
    const raw = (tarot as TarotCardRaw[]).find(
      c => c.fileName === n || c.name === n
    );
    if (!raw) return undefined;

    const displayName = raw.name ?? raw.fileName ?? n;
    const keywords = raw.keywords ?? raw.short_meaning ?? [];

    // [ADDED] Join general.* into paragraphs if present, else fall back to interpretation
    const generalText = raw.general
      ? [
        raw.general.visual_description,
        raw.general.meaning,
        raw.general.reversed_meaning,
      ]
        .filter(Boolean)
        .join('\n\n') // double line break between sections
      : (raw.interpretation ?? '');

    return { displayName, keywords, generalText };
  };

  // [ADDED] Pull per-card reading text based on current spread type (upright.* > general.meaning > interpretation)
  // const getReadingText = (cardId: string, mode: SpreadType): string => {
  //   const raw = (tarot as TarotCardRaw[]).find(c => c.fileName === cardId || c.name === cardId);
  //   if (!raw) return cardId;

  //   const title = raw.name ?? raw.fileName ?? cardId;

  //   // Primary: upright by mode (only for one-card styles or if you choose to reuse)
  //   const uprightByMode =
  //     mode && (mode === 'daily')
  //       ? raw.upright?.[mode] ?? null
  //       : null;

  //   // Fallbacks
  //   const generalMeaning = raw.general?.meaning ?? null;
  //   const legacy = raw.interpretation ?? null;

  //   const text = uprightByMode || generalMeaning || legacy || '';
  //   return text ? `${title} — ${text}` : title;
  // };

  const MAX_SELECTION =
    spreadType ? SPREAD_META[spreadType].picks :
      3;

  // UseRef
  const danteRef = useRef<HTMLImageElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const confirmInputRef = useRef<HTMLInputElement>(null);

  const sessionIdRef = useRef<string | null>(null);
    if (!sessionIdRef.current) {
      sessionIdRef.current =
        typeof window !== 'undefined' && 'crypto' in window
          ? window.crypto.randomUUID()
          : Math.random().toString(36).slice(2); // fallback
    }

  // Card name data
  const CARD_NAMES: string[] = [
    '0 O THE FOOL', '1 I THE MAGICIAN', '2 II THE HIGH PRIESTESS', '3 III THE EMPRESS', '4 IV THE EMPEROR',
    '5 V THE HIEROPHANT', '6 VI THE LOVERS', '7 VII THE CHARIOT', '8 VIII STRENGTH', '9 IX THE HERMIT',
    '10 X WHEEL OF FORTUNE', '11 XI JUSTICE', '12 XII THE HANGED MAN', '13 XIII DEATH', '14 XIV TEMPERANCE',
    '15 XV THE DEVIL', '16 XVI THE TOWER', '17 XVII THE STAR', '18 XVIII THE MOON', '19 XIX THE SUN',
    '20 XX JUDGEMENT', '21 XXI THE WORLD',
    // Cups
    '22 A ACE OF CUPS', '23 II TWO OF CUPS', '24 III THREE OF CUPS', '25 IV FOUR OF CUPS', '26 V FIVE OF CUPS',
    '27 VI SIX OF CUPS', '28 VII SEVEN OF CUPS', '29 VIII EIGHT OF CUPS', '30 IX NINE OF CUPS', '31 X TEN OF CUPS',
    '32 P PAGE OF CUPS', '33 KN KNIGHT OF CUPS', '34 Q QUEEN OF CUPS', '35 K KING OF CUPS',
    // // Pentacles
    '36 A ACE OF PENTACLES', '37 II TWO OF PENTACLES', '38 III THREE OF PENTACLES', '39 IV FOUR OF PENTACLES',
    '40 V FIVE OF PENTACLES', '41 VI SIX OF PENTACLES', '42 VII SEVEN OF PENTACLES', '43 VIII EIGHT OF PENTACLES',
    '44 IX NINE OF PENTACLES', '45 X TEN OF PENTACLES', '46 P PAGE OF PENTACLES', '47 KN KNIGHT OF PENTACLES',
    '48 Q QUEEN OF PENTACLES', '49 K KING OF PENTACLES',
    // // Swords
    '50 A ACE OF SWORDS', '51 II TWO OF SWORDS', '52 III THREE OF SWORDS', '53 IV FOUR OF SWORDS',
    '54 V FIVE OF SWORDS', '55 VI SIX OF SWORDS', '56 VII SEVEN OF SWORDS', '57 VIII EIGHT OF SWORDS',
    '58 IX NINE OF SWORDS', '59 X TEN OF SWORDS', '60 P PAGE OF SWORDS', '61 KN KNIGHT OF SWORDS',
    '62 Q QUEEN OF SWORDS', '63 K KING OF SWORDS',
    // // Wands
    '64 A ACE OF WANDS', '65 II TWO OF WANDS', '66 III THREE OF WANDS', '67 IV FOUR OF WANDS',
    '68 V FIVE OF WANDS', '69 VI SIX OF WANDS', '70 VII SEVEN OF WANDS', '71 VIII EIGHT OF WANDS',
    '72 IX NINE OF WANDS', '73 X TEN OF WANDS', '74 P PAGE OF WANDS', '75 KN KNIGHT OF WANDS',
    '76 Q QUEEN OF WANDS', '77 K KING OF WANDS'
  ];

  // Check if device is desktop
  const isDesktop = typeof window !== 'undefined' && !/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  // Listen for ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenCard(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Handle card selection/deselection
  const handleCardClick = (name: string) => {
    setSelected(prev => {
      const newSelection = prev.includes(name)
        ? prev.filter(n => n !== name)
        : prev.length < MAX_SELECTION
          ? [...prev, name]
          : prev;

      if (!prev.includes(name) && newSelection.length === MAX_SELECTION) {
        setTimeout(() => {
          // console.log('Selected cards:', newSelection);
        }, 150);
      }

      return newSelection;
    });
  };

  // Reshuffle deck and clear selections
  const handleShuffle = async () => {
    setLoading(false);
    setShowDeck(false);
    setShuffleDeck(false);
    setTimeout(() => {
      setDeck(shuffleArray(deck));
      setShowDeck(true);
      setShuffleDeck(true);
    }, 1500);
  };

  const handleReveal = async () => {
    setShowReveal(false);
    setShowDeck(false);
    setTimeout(() => {
      setShowReveal(true);
    }, REVEAL_MOUNT_DELAY_MS);
  };


  // Confirm cards selection
  const handleInterpret = async () => {
    setShowReveal(false);
    setShuffleDeck(false);
    setLoading(true);
    try {
      setShowDeck(false); // Trigger arc exit before revealing cards
      const payload = {
        question: question || null,
        cards: selected,
        spreadCount: MAX_SELECTION,
        spreadType
      };
      console.log(payload);

      if (spreadType === 'celtic_cross' || spreadType === 'three_card_basic' || spreadType === 'three_card_cause_effect' || spreadType === 'yesno') {
        const res = await axios.post(
          `${URL_CONFIG.url}/agent/tarot`,
          { input: payload },
          { timeout: 70000, withCredentials: true }
        );
        setResult(res.data.result);
        console.log("Tarot result:", res.data.result);
        return;
      }

      if (spreadType === 'daily') {
        const first = selected[0];
        const info = (tarot as any[]).find(
          c => c.fileName === first || c.name === first  // supports new & old JSON
        );
        const key = spreadType as 'daily';
        const uprightText: string | undefined = info?.upright?.[key];

        setResult(
          uprightText ??
          "Lorem ipsum dolor sit amet, consectetur adipiscing elit. (Single-card placeholder)"
        );
        return;
      }

      // fallback for 3-card or unknown spread
      setResult("Lorem ipsum dolor sit amet, consectetur adipiscing elit. (General 3-card placeholder)");

    } finally {
      setLoading(false);
    }
  };

  const openSpreadConfirm = (type: SpreadType) => {
    if (type === 'daily') {
      setSpreadType('daily');
      setSubmittedQuestion('');
      setQuestion('');
      setHasSubmitted(true);
      setShowDeck(true);
      setSelected([]);           // fresh selection
      setShowSpreadConfirm(false);
      setPendingSpread(null);
      return;
    }
    setPendingSpread(type);
    setTempQuestion('');
    setShowSpreadConfirm(true);
  };

  const cancelSpreadConfirm = () => {
    setShowSpreadConfirm(false);
    setPendingSpread(null);
    setTempQuestion('');
  };

  const confirmSpread = () => {
    if (!pendingSpread) return;
    const meta = SPREAD_META[pendingSpread];
    if (meta.requiresQuestion && !tempQuestion.trim()) return; // guard

    setSpreadType(pendingSpread);
    setSubmittedQuestion(tempQuestion.trim() || '');
    setQuestion(tempQuestion.trim()); // keep legacy code paths happy
    setHasSubmitted(true);
    setShowDeck(true);
    setSelected([]); // fresh selection
    setShowSpreadConfirm(false);
    setPendingSpread(null);
  };

  const skipTyping = () => {
    if (isTyping) {
      setTyped(result);
      setIsTyping(false);
    }
  };

  // [ADD] Boot/loading helpers
  const MIN_BOOT_MS = 2500; // 2.5s minimum splash

  const preloadImage = (src: string) =>
    new Promise<void>((resolve) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => resolve(); // don't block on error
      img.src = src;
    });

  // [ADD] Small inner component for animated dots
  function LoadingDots() {
    const [n, setN] = useState(0);
    useEffect(() => {
      const id = setInterval(() => setN((v) => (v + 1) % 4), 400);
      return () => clearInterval(id);
    }, []);
    return <>{'.'.repeat(n)}</>;
  }

  // [ADD] Tutorial config
  const TUTORIAL_COOKIE = 'dante_tutorial_seen';
  const TUTORIAL_SLIDES: { src: string; title: string; blurb?: string }[] = [
    { src: '/tutorial/slide1.png', title: 'Pick a Spread', blurb: 'Choose a spread.' },
    { src: '/tutorial/slide2.png', title: 'Ask a Question', blurb: "Ask a question. The more detailed, the better the interpretation's results" },
    { src: '/tutorial/slide3.png', title: 'Draw Cards', blurb: 'Draw the cards. You also have options to shuffle cards too.' },
    { src: '/tutorial/slide4.png', title: 'Reveal & Read', blurb: 'Cards flip, then asks DANTE to narrate your reading.' },
    { src: '/tutorial/slide5.png', title: 'Save & Restart', blurb: 'Restart anytime or save notes for later.' },
  ];

  // [ADD] Single handler; same function for Next/Confirm/Skip (as you wanted)
  const handleTutorialAdvance = (mode: 'next' | 'skip' | 'confirm' = 'next') => {
    const last = tutorialIndex >= TUTORIAL_SLIDES.length - 1;

    // If skip anywhere, or confirm on last slide => finish & remember
    if (mode === 'skip' || (mode === 'confirm' && last)) {
      Cookies.set(TUTORIAL_COOKIE, 'true', { expires: 365 });
      setTutorialSeen(true);
      setTutorialOpen(false);
      return;
    }

    // If not last → go next; if last but pressed "next", treat as confirm
    if (!last) {
      setTutorialIndex((i) => i + 1);
    } else {
      Cookies.set(TUTORIAL_COOKIE, 'true', { expires: 365 });
      setTutorialSeen(true);
      setTutorialOpen(false);
    }
  };

  const handleTutorialPrev = () => {
    setTutorialIndex((i) => Math.max(0, i - 1));
  };

  const openTutorialAnytime = () => {
    setTutorialIndex(0);
    setTutorialOpen(true);
  };

  const REVEAL_MOUNT_DELAY_MS = 180; // match your arc exit (180ms) + tiny buffer

  // ⭐ UPDATED: now also sends sessionId + spreadType
  const trackClick = (event: string, spreadType?: SpreadType) => {
    axios.post(
      `${URL_CONFIG.url}/kpi/click`,
      {
        event,
        page: 'tarot_demo1',
        sessionId: sessionIdRef.current,
        spreadType: spreadType ?? null,
      },
      { withCredentials: true }
    )
    .catch((err) => {
      console.error('KPI tracking error:', err);
    });
  };


  useEffect(() => {
    const verifyUser = async () => {
      try {
        await axios.get(`${URL_CONFIG.url}/user/verify`, { withCredentials: true });
      } catch (error: any) {
        if (error.response?.status === 403) {
          // user exists but not approved → send to queue page
          window.location.href = "/queue";
        } else if (error.response?.status === 401) {
          window.location.href = `${URL_CONFIG.url}/auth0/login`;
          return;
        } else {
          console.error("Verification error:", error);
        }
      }
    };
  
    verifyUser();
  }, []);  

  // Rotate Dante
  useEffect(() => {
    if (hovered !== null && danteRef.current) {
      const handleMouseMove = (e: MouseEvent) => {
        const rect = danteRef.current!.getBoundingClientRect()
        const centerX = rect.left + rect.width / 2
        const centerY = rect.top + rect.height / 2
        const dx = e.clientX - centerX
        const dy = e.clientY - centerY
        const rad = Math.atan2(dy, dx)
        setCursorAngle(rad * (180 / Math.PI) - 90)
      }
      window.addEventListener('mousemove', handleMouseMove)
      return () => window.removeEventListener('mousemove', handleMouseMove)
    } else {
      setCursorAngle(0) // reset when not hovering
    }
  }, [hovered])

  // [ADDED] Type-anywhere → pipe chars into the input even when not focused
  useEffect(() => {
    const onType = (e: KeyboardEvent) => {
      if (hasSubmitted) return;
      if (spreadType === 'daily') return;

      const isTypingKey = e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey;
      const isBackspace = e.key === 'Backspace';

      // Let Enter submit naturally via <form onSubmit>
      if (e.key === 'Enter') return;

      if (isTypingKey || isBackspace) {
        const el = inputRef.current;
        if (!el) return;

        // If input isn’t focused, focus and append/remove char via state
        if (document.activeElement !== el) {
          el.focus();
          if (isTypingKey) {
            setQuestion(q => q + e.key);
            e.preventDefault();
          } else if (isBackspace) {
            setQuestion(q => q.slice(0, -1));
            e.preventDefault();
          }
        }
      }
    };

    window.addEventListener('keydown', onType);
    return () => window.removeEventListener('keydown', onType);
  }, [hasSubmitted]);

  useEffect(() => {
    if (hasSubmitted && !showDeck && stage === 'select' && spreadType === 'celtic_cross' && selected.length === 10) {
      const totalMs = ((selected.length - 1) * 300) + 800 + 200; // per-card delay + flip + buffer
      const t = setTimeout(() => setPostReveal(true), totalMs);
      return () => clearTimeout(t);
    }
    setPostReveal(false);
  }, [hasSubmitted, showDeck, stage, selected.length, spreadType]);

  useEffect(() => {
    if (!result) return;

    let cancelled = false;
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
        if (i >= result.length) {
          setIsTyping(false);
          return;
        }
        const ch = result[i++];
        setTyped(prev => prev + ch);

        const isPunct = /[.,!?…]/.test(ch);
        const delay =
          TYPE_BASE_MS +
          Math.random() * TYPE_VARIANCE_MS +
          (isPunct ? PUNCT_PAUSE_MS : 0);

        tickTimer = window.setTimeout(tick, delay);
      };

      tickTimer = window.setTimeout(tick, TYPE_BASE_MS);
    };

    const startTimer = window.setTimeout(beginTyping, TYPING_DELAY_MS);

    return () => {
      cancelled = true;
      clearTimeout(startTimer);
      if (tickTimer) clearTimeout(tickTimer);
    };
  }, [result]);

  // animate the "typing..." dots while we are waiting to start typing
  useEffect(() => {
    if (!isWaitingToType) return;
    setEllipsis(0);
    const id = setInterval(() => {
      setEllipsis(prev => (prev + 1) % 4); // cycles 0..3
    }, 400);
    return () => clearInterval(id);
  }, [isWaitingToType]);

  useEffect(() => {
    if (showSpreadConfirm) {
      const id = requestAnimationFrame(() => {
        confirmInputRef.current?.focus();
      });
      return () => cancelAnimationFrame(id);
    }
  }, [showSpreadConfirm]);

  useEffect(() => {
    if (!showSpreadConfirm) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        confirmSpread(); // same function as button click
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showSpreadConfirm, confirmSpread]);

  useEffect(() => {
    if (!isThinking) return;
    setThinkingDots(0);
    const id = setInterval(() => {
      setThinkingDots(prev => (prev + 1) % 4); // 0..3
    }, 400);
    return () => clearInterval(id);
  }, [isThinking]);

  // [REPLACE] Unified boot: cookie, preload assets, shuffle deck, enforce minimum splash time
  useEffect(() => {
    let cancelled = false;

    const boot = async () => {
      // 1) Read cookies ASAP
      const accepted = Cookies.get('dante_agreed') === 'true';
      if (accepted) setAgreed(true);

      const tutSeen = Cookies.get(TUTORIAL_COOKIE) === 'true';
      setTutorialSeen(tutSeen);

      // 2) Start async tasks in parallel
      const preloadTasks: Promise<any>[] = [];
      preloadTasks.push(preloadImage("/tarot/table.png"));
      preloadTasks.push(preloadImage("/tarot/back.jpg"));
      preloadTasks.push(preloadImage("/tarot/dante.PNG"));

      const shuffled = shuffleArray(CARD_NAMES);
      setDeck(shuffled);

      await Promise.all([
        Promise.all(preloadTasks),
        new Promise((r) => setTimeout(r, MIN_BOOT_MS)),
      ]);

      if (!cancelled) setIsBooting(false);
    };

    boot();
    return () => { cancelled = true; };
  }, []);

  // [ADD] When user has agreed to Welcome and hasn’t seen tutorial → open it
  useEffect(() => {
    if (!isBooting && agreed && !tutorialSeen) {
      setTutorialIndex(0);
      setTutorialOpen(true);
    }
  }, [isBooting, agreed, tutorialSeen]);


  // HTML STRUCTURE
  return (
    <div className="relative overflow-hidden">
      {/* [ADD] Boot splash overlay (fades out after min 2.5s + preloads) */}
      <AnimatePresence>
        {isBooting && (
          <motion.div
            key="boot-splash"
            className="fixed inset-0 z-[200] bg-cover bg-center flex flex-col items-center justify-center text-white"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
          >
            {/* Logo / Mascot */}
            <motion.img
              src="/customEmote/murderous_intent.png"
              alt="DANTE"
              className="w-32 h-32 object-contain mb-6"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
            />
            {/* Title */}
            <motion.div
              className="text-xl font-semibold tracking-wide"
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.5 }}
            >
              Setting up the table, brb!
            </motion.div>
            {/* Animated dots */}
            <motion.div
              className="mt-3 text-neutral-300 text-base tabular-nums"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25, duration: 0.4 }}
            >
              <span className="inline-block w-6 text-left">
                <LoadingDots />
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {tutorialOpen && (
          <motion.div
            key="tutorial-modal"
            className="fixed inset-0 z-[140] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
            role="dialog"
            aria-modal="true"
            onClick={() => handleTutorialAdvance('skip')}
          >
            <motion.div
              className="relative w-full max-w-4xl bg-neutral-950/95 border border-neutral-800 rounded-2xl shadow-2xl p-0 overflow-hidden"
              initial={{ scale: 0.96, y: 8, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.96, y: 8, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.25, 1, 0.5, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
                <h2 className="text-lg font-semibold text-neutral-100">
                  Quick Tutorial ({tutorialIndex + 1}/{TUTORIAL_SLIDES.length})
                </h2>
                <button
                  onClick={() => handleTutorialAdvance('skip')}
                  className="text-neutral-300 hover:text-white transition"
                  aria-label="Skip"
                  title="Skip tutorial"
                >
                  <X />
                </button>
              </div>

              {/* Slide */}
              <div className="flex flex-col md:flex-row gap-6 px-6 py-6 items-center">
                <div className="w-full md:w-1/2">
                  <img
                    src={TUTORIAL_SLIDES[tutorialIndex].src}
                    alt={TUTORIAL_SLIDES[tutorialIndex].title}
                    className="w-full h-auto rounded-xl object-contain bg-neutral-900"
                    draggable={false}
                  />
                </div>
                <div className="w-full md:w-1/2 text-neutral-200 space-y-3">
                  <h3 className="text-2xl font-semibold">
                    {TUTORIAL_SLIDES[tutorialIndex].title}
                  </h3>
                  {TUTORIAL_SLIDES[tutorialIndex].blurb && (
                    <p className="text-neutral-300 leading-relaxed">
                      {TUTORIAL_SLIDES[tutorialIndex].blurb}
                    </p>
                  )}
                </div>
              </div>

              {/* Footer controls */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-800">
                {/* Left: Previous */}
                <button
                  onClick={handleTutorialPrev}
                  disabled={tutorialIndex === 0}
                  className="px-4 py-2 rounded-lg border border-neutral-700 text-neutral-300 hover:bg-neutral-800 disabled:opacity-50 transition"
                >
                  Previous
                </button>

                {/* Center: Dots */}
                {/* <div className=" items-center gap-2">
                  {TUTORIAL_SLIDES.map((_, i) => (
                    <span
                      key={i}
                      className={`w-2.5 h-2.5 rounded-full ${
                        i === tutorialIndex ? 'bg-white' : 'bg-neutral-600'
                      }`}
                    />
                  ))}
                </div> */}

                {/* Right: Primary action (same function; label changes by state) */}
                <button
                  onClick={() =>
                    tutorialIndex < TUTORIAL_SLIDES.length - 1
                      ? handleTutorialAdvance('next')     // go next
                      : handleTutorialAdvance('confirm')  // last → confirm
                  }
                  className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-500 transition"
                >
                  {tutorialIndex < TUTORIAL_SLIDES.length - 1 ? 'Next' : 'Confirm'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {!isBooting && (
        <div className="relative bg-[url('/tarot/table.png')] bg-cover bg-center w-screen h-screen">
          {/* Introduction */}
          {!agreed && (
            <motion.div className="fixed inset-0 z-50 bg-black text-white flex flex-col justify-center items-center text-center"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}>
              <div className="mb-6">
                <h1 className="text-2xl">Welcome, traveller from afar!</h1>
                <p className="text-lg">You have walked into DANTE's coven, where he does his magnificent tarot reading.</p>
              </div>
              <div className="mb-6">
                <p className="text-sm">You are allowed to ask any questions deemed appropriate, but keep in mind that you don't ask the same question twice in the timespan of ONE MONTH.</p>
                <p className="text-sm">Because, what would be the point of reading tarot if you don't like the results!?</p>
              </div>
              <button
                onClick={() => {
                  Cookies.set('dante_agreed', 'true', { expires: 365 });
                  setAgreed(true);
                }}
                className="px-6 py-3 bg-blue-600 rounded text-white"
              >
                Let's get started!
              </button>
            </motion.div>
          )}
          {/* DANTE */}
          {hasSubmitted && (
            <motion.div
              className="relative flex justify-center select-none"
              initial={{ opacity: 0, translateY: -600 }}
              animate={{ opacity: showDeck ? 1 : 0, translateY: showDeck ? -400 : -600 }}
              transition={{ delay: 0.35, duration: 0.85, ease: [0.25, 1, 0.5, 1] }}
            >
              <motion.img
                ref={danteRef}
                src="/tarot/dante.PNG"
                alt="Dante"
                className="max-w-3xl"
                animate={{ rotate: cursorAngle }}
                initial={{ rotate: 0 }}
                transition={{ duration: 0.85, ease: [0.25, 1, 0.5, 1] }}
              />
            </motion.div>
          )}
          {/* Tarot card spread */}
          <AnimatePresence mode="wait">
            {hasSubmitted && stage === 'select' && showDeck && (
              <div className="relative my-16">
                <motion.div
                  style={{ pointerEvents: showDeck ? 'auto' : 'none' }}
                  key="deck-arc"
                  className="relative place-content-center"
                  initial={{ opacity: 0, scale: 0.8, translateY: -150 }}
                  animate={{ opacity: 1, scale: 1, translateY: 0 }}
                  exit={{ opacity: 0, scale: 0.8, translateY: -150 }}
                  transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
                >
                  {/* Card layout */}
                  {deck.map((name, i) => {
                    const { angle, rad, xOffset, yOffset } = computeCardPosition(i, deck.length);
                    const left = `calc(${CENTER_X_PCT}% + ${xOffset}px)`;
                    const top = `calc(${yOffset}px + ${ARC_Y_ANCHOR}px)`;
                    // const left = `calc(46.25% + ${xOffset}px)`;
                    // const top = `calc(${yOffset}px - 300px)`;

                    const centerIndex = (deck.length - 1) / 2;
                    const distFromCenter = i - centerIndex;
                    const centerShift = selected.includes(name) ? distFromCenter * CENTER_SHIFT_K : 0;
                    // const centerShift = selected.includes(name) ? distFromCenter*1.9 : 0;

                    let shift = 0;

                    // Selected cards push others
                    selected.forEach(selName => {
                      const selIndex = deck.indexOf(selName);
                      const dist = i - selIndex;
                      const absDist = Math.abs(dist);

                      if (absDist > 0 && absDist <= maxRange) {
                        const factor = (maxRange - (absDist - 1)) / maxRange;
                        const basePush = selected.includes(deck[i])
                          ? SELF_SELECTED_PUSH_BASE * scale
                          : SELECT_PUSH_BASE * scale;
                        // const basePush = selected.includes(deck[i]) ? 50 : 100;
                        shift += dist < 0 ? 0.3 * basePush * factor : -0.3 * basePush * factor;
                      }
                    });

                    // Hovered card pushes others — BUT not if hovered card is selected
                    if (hovered !== null && !selected.includes(deck[hovered])) {
                      const dist = i - hovered;
                      const absDist = Math.abs(dist);

                      if (absDist > 0 && absDist <= maxRange) {
                        const factor = (maxRange - (absDist - 1)) / maxRange;
                        const hoverPush = HOVER_PUSH_BASE * scale;
                        shift += dist < 0 ? hoverPush * factor : -hoverPush * factor;
                        // if (absDist > 0 && absDist <= maxRange) {
                        //   const factor = (maxRange - (absDist - 1)) / maxRange;
                        //   shift += dist < 0 ? 10 * factor : -10 * factor;
                      }
                    }


                    const yShift = Math.sin(rad) * shift

                    return (
                      <motion.div
                        key={name}
                        className="absolute"
                        style={{ left, top, zIndex: i }}
                        onHoverStart={() => setHovered(i)}
                        onHoverEnd={() => setHovered(null)}
                        initial={{ x: 0, y: 0 }}
                        animate={{
                          x: selected.includes(name) ? shift + centerShift : shift,
                          y: selected.includes(name) ? yShift + SELECT_LIFT : yShift
                          // y: selected.includes(name) ? yShift - 80 : yShift
                        }}
                        transformTemplate={(transform) => {
                          // Use only translateX and translateY from the transform object
                          const x = transform.x || '0px';
                          const y = transform.y || '0px';
                          return `translateX(${x}) translateY(${y}) rotate(${angle}deg)`;
                        }}
                        transition={{ delay: 0.1, duration: 0.85, ease: [0.25, 1, 0.5, 1] }}
                      >
                        <motion.img
                          src={asset("/tarot/back.jpg")}
                          alt="Card back"
                          className="w-28 h-48 rounded-lg cursor-pointer transition-transform select-none"
                          style={{ width: `${cardW}px`, height: `${cardH}px` }}
                          onClick={() => handleCardClick(name)}
                          draggable={false}
                          onDragStart={(e) => e.preventDefault()}
                          {...(isDesktop && {
                            whileHover: {
                              boxShadow: '0 0 25px #6380ff80',
                              translateY: -20,
                              transition: { duration: 0.02, ease: [0.25, 1, 0.5, 1] }
                            },
                            whileTap: {
                              translateY: -20,
                              scale: 1.05,
                              transition: { duration: 0.02, ease: [0.25, 1, 0.5, 1] }
                            }
                          })}
                        />
                      </motion.div>
                    );
                  })}
                </motion.div>
              </div>
            )}
          </AnimatePresence>
          {/* ADDED: Face-up card details overlay (JSON-powered) */}
          <AnimatePresence>
            {openCard && (
              <motion.div
                key="tarot-overlay"
                className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
                onClick={() => setOpenCard(null)}
                role="dialog"
                aria-modal="true"
              >
                <motion.div
                  className="relative p-4 w-full max-w-4xl bg-neutral-950/95 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden"
                  initial={{ scale: 0.95, y: 10 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.95, y: 10 }}
                  transition={{ duration: 0.25, ease: [0.25, 1, 0.5, 1] }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex place-content-center border-b-1 border-b-neutral-800 pb-2 mb-4">
                    {/* Exit button */}
                    <div className="flex place-content-center">
                      <h2 className="font-medium">
                        DANTE'S TAROT GUIDEBOOK
                      </h2>
                    </div>
                    <div className="absolute right-4">
                      <motion.button
                        onClick={() => setOpenCard(null)}
                        className="flex items-center justify-center text-neutral-200 cursor-pointer hover:scale-110 transition"
                        whileTap={{ scale: 0.9 }}
                        aria-label="Close"
                      >
                        <X />
                      </motion.button>
                    </div>
                  </div>
                  <div className="flex place-content-evenly">
                    {/* Card image */}
                    <div className="flex items-center justify-center">
                      <img
                        src={`/tarot/raide_waite/${encodeURIComponent(openCard)}.png`}
                        alt={openCard}
                        className="h-[48vh] max-h-[520px] object-contain"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                    {/* Text content from imported JSON */}
                    <div className="w-1/2 text-neutral-200 space-y-4">
                      {(() => {
                        const info = getCardInfo(openCard);
                        return (
                          <>
                            <h2 className="text-3xl font-semibold tracking-wide">
                              {info?.displayName ?? openCard}
                            </h2>
                            {info?.keywords?.length ? (
                              <ul className="flex flex-wrap gap-2 text-sm text-neutral-300">
                                {info.keywords.map((m, i) => (
                                  <li key={i} className="px-2 py-1 rounded-full bg-neutral-800/70 border border-neutral-700">
                                    {m}
                                  </li>
                                ))}
                              </ul>
                            ) : null}
                            <p className="text-base leading-relaxed text-neutral-300 whitespace-pre-line">
                              {info?.generalText || "No interpretation found for this card in your data file."}
                            </p>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
          {/* [ADDED] Spread Confirm Modal (insert here, right after the openCard overlay) */}
          <AnimatePresence>
            {showSpreadConfirm && pendingSpread && (
              <motion.div
                key="spread-confirm"
                className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
                onClick={cancelSpreadConfirm}
                role="dialog"
                aria-modal="true"
              >
                <motion.div
                  className="relative w-full max-w-xl bg-neutral-950/95 border border-neutral-800 rounded-2xl shadow-2xl p-6 text-neutral-100"
                  initial={{ scale: 0.96, y: 8 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.96, y: 8 }}
                  transition={{ duration: 0.25, ease: [0.25, 1, 0.5, 1] }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">
                      Confirm Spread — {SPREAD_META[pendingSpread].label}
                    </h2>
                    <button
                      onClick={cancelSpreadConfirm}
                      className="text-neutral-300 hover:text-white transition"
                      aria-label="Close"
                    >
                      <X />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <p className="text-neutral-300">
                      • <span className="font-medium">Cards to draw:</span> {SPREAD_META[pendingSpread].picks}
                    </p>
                    <p className="text-neutral-300">
                      • <span className="font-medium">Question:</span>{' '}
                      {SPREAD_META[pendingSpread].requiresQuestion ? (
                        <span className="text-red-400 font-medium">Required</span>
                      ) : (
                        <span className="text-neutral-400 italic">Optional</span>
                      )}
                    </p>

                    {pendingSpread && (
                      <div className="pt-1">
                        <label className="block text-sm text-neutral-400 mb-1">
                          Enter your question <span className="text-neutral-500 italic">(optional)</span>
                        </label>
                        <input
                          ref={confirmInputRef}
                          autoFocus
                          value={tempQuestion}
                          onChange={(e) => setTempQuestion(e.target.value)}
                          placeholder="What's on your mind?"
                          className="w-full px-4 py-3 rounded-xl bg-neutral-900 border border-neutral-800 outline-none text-neutral-200"
                        />
                      </div>
                    )}
                  </div>
                  <div className="mt-6 flex gap-3 justify-end">
                    <button
                      onClick={cancelSpreadConfirm}
                      className="px-4 py-2 rounded-lg border border-neutral-700 text-neutral-300 hover:bg-neutral-800 transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmSpread}
                      disabled={SPREAD_META[pendingSpread].requiresQuestion && !tempQuestion.trim()}
                      className="px-4 py-2 rounded-lg bg-green-600 text-white disabled:opacity-50 hover:bg-green-500 transition"
                    >
                      Confirm
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {hasSubmitted && !showDeck && stage === 'select' && (
              <motion.div
                key="reveal-block"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
              >
                <motion.div
                  key="reveal-spread"
                  className={`${selected.length === 10
                      ? 'grid grid-cols-5 gap-y-4 gap-x-1 place-items-center w-3/5'
                      : 'flex gap-4 w-3/4'
                    } fixed place-content-center top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30`}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{
                    opacity: 1,
                    y: postReveal && spreadType === 'celtic_cross' ? -80 : 0,
                    scale: postReveal && spreadType === 'celtic_cross' ? 0.92 : 1
                  }}
                  exit={{ opacity: 0, y: 50 }}
                  transition={{ duration: 0.8, ease: [0.25, 1, 0.5, 1] }}
                >
                  {selected.map((name, index) => (
                    <motion.div
                      key={`${name}-${index}`}
                      className={
                        `group ${selected.length === 10
                          ? 'w-full max-w-[180px]'
                          : postReveal
                            ? 'w-[14vw] min-w-[110px] max-w-[180px]'
                            : 'w-[20vw] min-w-[115px] max-w-[230px]'
                        } aspect-[7/12] select-none perspective-[1500px]`
                      }
                      onClick={() => setOpenCard(name)}
                    >
                      {/* Flip card container */}
                      <motion.div
                        className="relative w-full h-full transition-transform duration-700 [transform-style:preserve-3d]"
                        initial={{ rotateY: 0 }}
                        animate={{ rotateY: 180 }}
                        transition={{ delay: index * 0.3, duration: 0.8, ease: [0.25, 1, 0.5, 1] }}
                      >
                        {/* Back */}
                        <div className="absolute inset-0 [backface-visibility:hidden] rounded-lg">
                          <img
                            src="/tarot/back.jpg"
                            alt="Card Back"
                            className="w-full h-full rounded-lg object-cover"
                          />
                        </div>

                        {/* Front */}
                        <div className="absolute inset-0 rotate-y-180 [backface-visibility:hidden] rounded-lg">
                          <img
                            src={`/tarot/raide_waite/${encodeURIComponent(name)}.png`}
                            alt={name}
                            className="w-full h-full rounded-lg object-cover cursor-pointer"
                          />
                        </div>
                      </motion.div>

                      {/* Tooltip */}
                      <div className="z-50 absolute top-0 w-full h-full text-center place-content-center text-sm text-white bg-black/70 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                        {name}
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
                {hasSubmitted && !showDeck && stage === 'select' && showReveal && (
                  <motion.div
                    className="mt-6 w-full flex items-center justify-center gap-3 z-30"
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 50 }}
                    transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1], delay: 1.5 }}
                  >
                    <button
                      onClick={() => window.location.reload()}
                      className="px-4 py-2 rounded-lg border border-neutral-700 text-neutral-200 hover:bg-neutral-800 transition"
                    >
                      Restart
                    </button>
                    <button
                      onClick={() => {
                        trackClick('clickInterpret', spreadType); 
                        handleInterpret();
                      }}
                      disabled={loading || !!result}
                      className="px-4 py-2 rounded-lg bg-green-600 text-white disabled:opacity-50 hover:bg-green-500 transition"
                    >
                      {loading ? 'Thinking…' : (result ? 'Done' : "Interpret the cards")}
                    </button>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {!hasSubmitted && (
              <motion.div
                key="input-modal"
                className="relative flex place-content-center w-screen h-screen bg-neutral-900/50 backdrop-blur-md"
                initial={{ opacity: 1 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, pointerEvents: 'none' }}
                transition={{ duration: 0.25, ease: [0.25, 1, 0.5, 1] }}>
                <div className="relative place-content-center items-center min-h-screen min-w-screen">
                  <div className="flex place-content-center pb-4">
                    <p className="flex text-center font-semibold text-lg break-words">Choose a spread:</p>
                  </div>
                  <div className="flex place-content-center pb-8">
                    <ul className="flex flex-wrap w-1/2 place-content-center gap-4">
                      <li>
                        <button className="flex gap-4 place-content-evenly bg-neutral-900:90 rounded-2xl backdrop-blur-2xl cursor-pointer 
                            hover:scale-105 transition duration-300 p-4"
                          onClick={() => openSpreadConfirm('daily')}>
                          <div className="p-4 bg-neutral-900 rounded-2xl">
                            <Lightbulb />
                          </div>
                          <div className="relative place-content-evenly">
                            <p className="flex text-center font-semibold text-lg break-words">Daily Vibes</p>
                            <p className="flex text-center font-light text-sm break-words">Spread of One</p>
                          </div>
                        </button>
                      </li>
                      <li>
                        <button className="flex gap-4 place-content-evenly bg-neutral-900:90 rounded-2xl backdrop-blur-2xl cursor-pointer 
                            hover:scale-105 transition duration-300 p-4"
                          onClick={() => openSpreadConfirm('yesno')}>
                          <div className="p-4 bg-neutral-900 rounded-2xl">
                            <Brain />
                          </div>
                          <div className="relative place-content-evenly">
                            <p className="flex text-center font-semibold text-lg break-words">Yes.. No.. Or Maybe?</p>
                            <p className="flex text-center font-light text-sm break-words">Spread of Three</p>
                          </div>
                        </button>
                      </li>
                      <li>
                        <button className="flex gap-4 place-content-evenly bg-neutral-900:90 rounded-2xl backdrop-blur-2xl cursor-pointer 
                            hover:scale-105 transition duration-300 p-4"
                          onClick={() => openSpreadConfirm('three_card_basic')}>
                          <div className="p-4 bg-neutral-900 rounded-2xl">
                            <CalendarClock />
                          </div>
                          <div className="relative place-content-evenly">
                            <p className="flex text-center font-semibold text-lg break-words">Past, Present, and Future</p>
                            <p className="flex text-center font-light text-sm break-words">Spread of Three</p>
                          </div>
                        </button>
                      </li>
                      <li>
                        <button className="flex gap-4 place-content-evenly bg-neutral-900:90 rounded-2xl backdrop-blur-2xl cursor-pointer 
                            hover:scale-105 transition duration-300 p-4"
                          onClick={() => openSpreadConfirm('three_card_cause_effect')}>
                          <div className="p-4 bg-neutral-900 rounded-2xl">
                            <Sprout />
                          </div>
                          <div className="relative place-content-evenly">
                            <p className="flex text-center font-semibold text-lg break-words">Cause & Result</p>
                            <p className="flex text-center font-light text-sm break-words">Spread of Three</p>
                          </div>
                        </button>
                      </li>
                      <li>
                        <button className="flex gap-4 place-content-evenly bg-linear-to-bl from-violet-500 to-fuchsia-500 rounded-2xl backdrop-blur-2xl cursor-pointer 
                            hover:scale-105 hover:bg-linear-to-bl hover:from-fuchsia-500 hover:to-cyan-500 transition duration-300 ease-in-out p-4"
                          onClick={() => openSpreadConfirm('celtic_cross')}>
                          <div className="p-4 bg-neutral-900 rounded-2xl">
                            <Sparkle />
                          </div>
                          <div className="relative place-content-evenly">
                            <p className="flex text-center font-semibold text-lg break-words">Celtic Cross Tarot Reading</p>
                            <p className="flex text-center font-light text-sm break-words">Spread of Ten</p>
                          </div>
                        </button>
                      </li>
                    </ul>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {hasSubmitted && (
            <motion.div
              className="relative w-full text-center"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
            >
              <AnimatePresence mode="wait">
                {(selected.length < MAX_SELECTION || (selected.length === MAX_SELECTION && stage === 'select' && showDeck)) && (
                  <motion.div
                    key={selected.length === MAX_SELECTION ? 'confirm-ui' : 'pick-ui'}
                    className={`text-center`}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
                  >
                    {selected.length < MAX_SELECTION ? (
                      <>
                        {/* Question Input */}
                        <span className="text-center text-neutral-300 text-xl font-normal text-shadow-indigo-700">
                          {submittedQuestion?.trim()
                            ? `You have asked: ${submittedQuestion}`
                            : spreadType === 'daily'
                              ? `You have chosen one card spread. Now, take a deep breath and pick your cards...`
                              : `Now, take a deep breath and pick your cards...`}
                        </span>
                        {/* No. of cards picked */}
                        <span className="block text-neutral-300 text-lg font-light mt-2">
                          You have picked {selected.length} / {MAX_SELECTION} cards
                        </span>

                        <button
                          onClick={() => {
                            if (selected.length !== 0) {
                              setSelected([]);
                            } else {
                              handleShuffle();
                            }
                          }}
                          disabled={!showDeck}
                          className="relative mt-4 px-4 py-2 bg-green-600 text-white rounded-sm cursor-pointer disabled:opacity-50"
                        >
                          {selected.length != 0 ? 'Reset' : 'Shuffle'}
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="block text-neutral-300 text-2xl font-light">
                          Ready to do the reading?
                        </span>
                        <button
                          onClick={() => {
                            trackClick('clickReveal', spreadType);
                            handleReveal();
                          }}
                          disabled={selected.length !== MAX_SELECTION}
                          className="relative mt-6 px-4 py-2 bg-green-600 text-white rounded-sm disabled:opacity-50"
                        >
                          Reveal Cards
                        </button>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
              <AnimatePresence>
                {isThinking && (
                  <motion.div
                    key="tarot-thinking"
                    className="flex flex-col gap-y-6 items-center w-full text-center p-4 rounded-lg shadow-lg place-content-center"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
                  >
                    <div className="bg-neutral-900/80 border border-neutral-950 rounded-2xl flex place-content-between max-w-3/4 gap-x-4 px-6 py-4">
                      <div className="flex-shrink-0 flex">
                        <img className="w-12 h-12 object-contain" src={statusEmote} alt="status" />
                      </div>
                      <span className="flex text-neutral-300 text-2xl font-normal text-left items-center align-middle cursor-default">
                        <span className="inline-flex items-center gap-2">
                          <span className="opacity-80 italic">thinking</span>
                          <span className="inline-flex w-6 justify-start tabular-nums">{'.'.repeat(thinkingDots)}</span>
                        </span>
                      </span>
                    </div>
                  </motion.div>
                )}
                {result && (
                  <motion.div
                    key="tarot-result"
                    className="flex flex-col gap-y-6 items-center w-full text-center p-4 rounded-lg shadow-lg place-content-center"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
                  >
                    <div className="bg-neutral-900/80 border border-neutral-950 rounded-2xl flex place-content-between max-w-3/4 gap-x-4 px-6 py-4">
                      <div className="flex-shrink-0 flex">
                        <img className="w-12 h-12 object-contain" src={statusEmote} alt="status" />
                      </div>
                      {/* <div className="w-px min-h-full bg-white mx-4" /> */}
                      {/* <span className="flex text-neutral-300 text-2xl font-normal items-center">
                        Actual API result
                        {result.result}
                        Mocked result
                        {result}
                      </span> */}
                      <span
                        className="flex text-neutral-300 text-2xl font-normal text-left items-center align-middle cursor-default"
                        onClick={skipTyping}
                        role="button"
                        aria-label="Skip typing animation"
                      >
                        {isWaitingToType ? (
                          <span className="inline-flex items-center gap-2">
                            <span className="opacity-80 italic">typing</span>
                            <span className="inline-flex w-6 justify-start tabular-nums">
                              {'.'.repeat(ellipsis)}
                            </span>
                          </span>
                        ) :
                          (
                            <>
                              {typed}
                            </>
                          )}
                      </span>
                    </div>
                    {!isTyping && !isWaitingToType && (
                       <motion.div
                        className="mt-6 w-full flex items-center justify-center gap-3 z-30"
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1], delay: 1.5 }}
                      >
                        <button
                          onClick={() => window.location.reload()}
                          className="px-4 py-2 rounded-lg border border-neutral-700 text-neutral-200 hover:bg-neutral-800 transition"
                        >
                          Restart
                        </button>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
          {/* [ADD] Floating “Tutorial” button (always available) */}
          <div className="fixed bottom-6 right-6 gap-4 flex place-content-end">
            <button
              onClick={openTutorialAnytime}
              className="rounded-full bg-neutral-900/90 border border-neutral-700 shadow-lg px-4 py-3 text-sm text-neutral-200 hover:bg-neutral-800 transition"
              title="Open tutorial"
            >
              Tutorial
            </button>
            {/* <button
              onClick={() => {
                // ❌ clear agreement cookie
                Cookies.remove('dante_agreed');
                // ❌ clear tutorial-seen cookie
                Cookies.remove(TUTORIAL_COOKIE);

                // 💾 reset local React state too (optional but clean)
                setAgreed(false);
                setTutorialSeen(false);

                // 🔄 hard reset UI
                window.location.reload();
              }}
              className="rounded-full bg-neutral-900/90 border border-neutral-700 shadow-lg px-4 py-3 text-sm text-neutral-200 hover:bg-neutral-800 transition"
            >
              Reset Agreement
            </button> */}
          </div>
        </div>
      )}
      <footer className="fixed bottom-6 w-screen flex place-content-center font-extralight text-xs">
        <p>All rights reserved to DANTE © (2025)</p>
      </footer>
    </div>
  );
}