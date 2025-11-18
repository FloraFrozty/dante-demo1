export type TarotCardRaw = {
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

export type TarotCardInfo = {
  displayName: string;
  keywords: string[];
  generalText: string;
};

export type SpreadType = 'daily' | 'yesno' | 'celtic_cross' | 'three_card_basic' | 'three_card_cause_effect' | null;

export type SpreadMeta = {
  picks: number;
  requiresQuestion: boolean;
  label: string;
};
