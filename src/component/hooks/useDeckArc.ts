import { useMemo } from 'react';
import { ARC, INTERACTION } from '@/component/const/layout';

export function computeCardPosition(i: number, deckLength: number, radius: number, maxAngle = ARC.MAX_ANGLE_DEG) {
  const t = deckLength > 1 ? i / (deckLength - 1) : 0.5;
  const angle = (t - 0.5) * maxAngle;
  const rad = (angle * Math.PI) / 180;
  const xOffset = Math.sin(rad) * radius;
  const yOffset = radius - Math.cos(rad) * radius;
  return { angle, rad, xOffset, yOffset };
}

export function useArcGeometry(scale: number) {
  return useMemo(() => {
    const radius = ARC.RADIUS_BASE * scale;
    const anchorY = ARC.ARC_Y_ANCHOR_BASE * scale;
    return {
      centerXPct: ARC.CENTER_X_PCT,
      radius,
      anchorY,
      selectLift: INTERACTION.SELECT_LIFT_BASE * scale,
      centerShiftK: INTERACTION.CENTER_SHIFT_K_BASE * scale,
      hoverPush: INTERACTION.HOVER_PUSH_BASE * scale,
      selectPush: INTERACTION.SELECT_PUSH_BASE * scale,
      selfSelectPush: INTERACTION.SELF_SELECTED_PUSH_BASE * scale,
      maxRange: INTERACTION.MAX_RANGE
    };
  }, [scale]);
}