export const URL_CONFIG = { url: 'http://localhost:8080' };

export const BASE_WIDTH = 1920;
export const BASE_HEIGHT = 1080;
export const SCALE_MIN = 0.70;
export const SCALE_MAX = 1.00;

export const CARD_W_BASE = 112;
export const CARD_H_BASE = 192;

export const ARC = {
  MAX_ANGLE_DEG: 90,
  RADIUS_BASE: -950,
  CENTER_X_PCT: 46.25,
  ARC_Y_ANCHOR_BASE: -300
} as const;

export const INTERACTION = {
  SELECT_LIFT_BASE: -80,
  CENTER_SHIFT_K_BASE: 1.9,
  MAX_RANGE: 20,
  HOVER_PUSH_BASE: 10,
  SELECT_PUSH_BASE: 100,
  SELF_SELECTED_PUSH_BASE: 50
} as const;

export const TYPING = {
  BASE_MS: 28,
  VARIANCE_MS: 12,
  PUNCT_PAUSE_MS: 180,
  START_DELAY_MS: 3000
} as const;

export const MIN_BOOT_MS = 2500;
export const TUTORIAL_COOKIE = 'dante_tutorial_seen';