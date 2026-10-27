'use client';

import { useRef, useCallback } from 'react';

interface LongPressOptions {
  onLongPress: () => void;
  onClick?: () => void;
  delay?: number;
}

export function useLongPress({ onLongPress, onClick, delay = 500 }: LongPressOptions) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPress = useRef(false);

  const start = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      isLongPress.current = false;
      timerRef.current = setTimeout(() => {
        isLongPress.current = true;
        onLongPress();
      }, delay);
    },
    [onLongPress, delay]
  );

  const clear = useCallback(
    (e: React.TouchEvent | React.MouseEvent, shouldTriggerClick = true) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (shouldTriggerClick && !isLongPress.current && onClick) {
        onClick();
      }
    },
    [onClick]
  );

  return {
    onMouseDown: (e: React.MouseEvent) => start(e),
    onMouseUp: (e: React.MouseEvent) => clear(e),
    onMouseLeave: (e: React.MouseEvent) => clear(e, false),
    onTouchStart: (e: React.TouchEvent) => start(e),
    onTouchEnd: (e: React.TouchEvent) => clear(e),
  };
}
