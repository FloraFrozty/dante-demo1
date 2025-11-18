import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { SpreadType, TarotCardInfo, TarotCardRaw } from '@/component/types/tarot';
import tarot from '@/data/tarot.json';
import { SPREAD_META } from '@/component/const/tarot';
import { postTarotReading } from '@/component/services/tarotAPI';
import { shuffleArray } from '@/component/utils/shuffle';

export function useTarotState(initialDeck: string[]) {
  // Core state
  const [deck, setDeck] = useState<string[]>(initialDeck);
  const [selected, setSelected] = useState<string[]>([]);
  const [spreadType, setSpreadType] = useState<SpreadType>(null);
  const [stage, setStage] = useState<'select' | 'reveal'>('select');

  // UI flags
  const [hovered, setHovered] = useState<number | null>(null);
  const [cursorAngle, setCursorAngle] = useState(0);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [submittedQuestion, setSubmittedQuestion] = useState<string | null>(null);

  const [showDeck, setShowDeck] = useState(true);
  const [shuffleDeck, setShuffleDeck] = useState(true);
  const [openCard, setOpenCard] = useState<string | null>(null);

  const [postReveal, setPostReveal] = useState(false);

  const [pendingSpread, setPendingSpread] = useState<SpreadType>(null);
  const [showSpreadConfirm, setShowSpreadConfirm] = useState(false);
  const [tempQuestion, setTempQuestion] = useState('');
  const [question, setQuestion] = useState('');

  // network/result
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  // refs
  const danteRef = useRef<HTMLImageElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const confirmInputRef = useRef<HTMLInputElement>(null);

  const MAX_SELECTION = useMemo(
    () => (spreadType ? SPREAD_META[spreadType].picks : 3),
    [spreadType]
  );

  // helpers
  const getCardInfo = useCallback((n: string): TarotCardInfo | undefined => {
    const raw = (tarot as TarotCardRaw[]).find(c => c.fileName === n || c.name === n);
    if (!raw) return undefined;

    const displayName = raw.name ?? raw.fileName ?? n;
    const keywords = raw.keywords ?? raw.short_meaning ?? [];
    const generalText = raw.general
      ? [raw.general.visual_description, raw.general.meaning, raw.general.reversed_meaning]
          .filter(Boolean)
          .join('\n\n')
      : (raw.interpretation ?? '');
    return { displayName, keywords, generalText };
  }, []);

  const getReadingText = useCallback((cardId: string, mode: SpreadType): string => {
    const raw = (tarot as TarotCardRaw[]).find(c => c.fileName === cardId || c.name === cardId);
    if (!raw) return cardId;
    const title = raw.name ?? raw.fileName ?? cardId;
    const uprightDaily = mode === 'daily' ? raw.upright?.daily ?? null : null;
    const generalMeaning = raw.general?.meaning ?? null;
    const legacy = raw.interpretation ?? null;
    const text = uprightDaily || generalMeaning || legacy || '';
    return text ? `${title} — ${text}` : title;
  }, []);

  // actions
  const handleCardClick = (name: string) => {
    setSelected(prev => {
      const next = prev.includes(name)
        ? prev.filter(n => n !== name)
        : prev.length < MAX_SELECTION
          ? [...prev, name]
          : prev;

      if (!prev.includes(name) && next.length === MAX_SELECTION) {
        setTimeout(() => console.log('Selected cards:', next), 150);
      }
      return next;
    });
  };

  const handleShuffle = () => {
    setLoading(false);
    setShowDeck(false);
    setShuffleDeck(false);
    setTimeout(() => {
      setDeck(shuffleArray(deck));
      setShowDeck(true);
      setShuffleDeck(true);
    }, 1500);
  };

  const openSpreadConfirm = (type: SpreadType) => {
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
    if (meta.requiresQuestion && !tempQuestion.trim()) return;

    setSpreadType(pendingSpread);
    setSubmittedQuestion(tempQuestion.trim() || '');
    setQuestion(tempQuestion.trim());
    setHasSubmitted(true);
    setShowDeck(true);
    setSelected([]);
    setShowSpreadConfirm(false);
    setPendingSpread(null);
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      setShowDeck(false);
      const payload = {
        question: question || null,
        cards: selected,
        spreadCount: MAX_SELECTION,
        spreadType
      };

      if (spreadType === 'daily') {
        const first = selected[0];
        const info = (tarot as TarotCardRaw[]).find(
          c => c.fileName === first || c.name === first
        );
        const uprightText = info?.upright?.daily;
        setResult(
          uprightText ?? 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. (Single-card placeholder)'
        );
        return;
      }

      if (spreadType === 'celtic_cross' || spreadType === 'three_card_basic' || spreadType === 'three_card_cause_effect' || spreadType === 'yesno') {
        const text = await postTarotReading(payload);
        setResult(text);
        return;
      }

      setResult('Lorem ipsum dolor sit amet, consectetur adipiscing elit. (General 3-card placeholder)');
    } finally {
      setLoading(false);
    }
  };

  // derived flags
  const isThinking = loading && hasSubmitted && stage === 'select' && !showDeck && !shuffleDeck;

  // misc effects that belong with state
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpenCard(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (hasSubmitted && !showDeck && stage === 'select' && spreadType === 'celtic_cross' && selected.length === 10) {
      const totalMs = ((selected.length - 1) * 300) + 800 + 200;
      const t = setTimeout(() => setPostReveal(true), totalMs);
      return () => clearTimeout(t);
    }
    setPostReveal(false);
  }, [hasSubmitted, showDeck, stage, selected.length, spreadType]);

  return {
    // state
    deck, setDeck, selected, setSelected, spreadType, setSpreadType, stage, setStage,
    hovered, setHovered, cursorAngle, setCursorAngle, hasSubmitted, setHasSubmitted,
    submittedQuestion, setSubmittedQuestion, showDeck, setShowDeck, shuffleDeck, setShuffleDeck,
    openCard, setOpenCard, postReveal, setPostReveal, pendingSpread, setPendingSpread,
    showSpreadConfirm, setShowSpreadConfirm, tempQuestion, setTempQuestion, question, setQuestion,
    loading, setLoading, result, setResult,

    // refs
    danteRef, inputRef, confirmInputRef,

    // helpers & actions
    MAX_SELECTION, getCardInfo, getReadingText, handleCardClick, handleShuffle,
    openSpreadConfirm, cancelSpreadConfirm, confirmSpread, handleConfirm,

    // derived
    isThinking
  };
}
