/**
 * Calculates the new scroll position needed to keep a row visible within the viewport.
 * If the row is already fully visible, the current scrollTop is preserved.
 */
export function keepInView(rowIndex: number, rowHeight: number, scrollTop: number, clientHeight: number): number {
  if (clientHeight <= 0) return scrollTop;
  const top = rowIndex * rowHeight;
  const bottom = top + rowHeight;
  if (top < scrollTop) {
    return top;
  }
  if (bottom > scrollTop + clientHeight) {
    return Math.max(0, bottom - clientHeight);
  }
  return scrollTop;
}

/**
 * Computes the target index when moving selection by delta (+1 for next, -1 for previous).
 * When nothing is selected (currentIndex < 0), picks topVisibleIndex for forward (+1),
 * or max(0, topVisibleIndex - 1) for backward (-1) navigation.
 */
export function targetLineIndex(currentIndex: number, delta: number, totalLines: number, topVisibleIndex = 0): number {
  if (totalLines <= 0) return -1;
  if (currentIndex < 0) {
    const start = Math.max(0, Math.min(totalLines - 1, topVisibleIndex));
    return delta > 0 ? start : Math.max(0, start - 1);
  }
  return Math.max(0, Math.min(totalLines - 1, currentIndex + delta));
}
