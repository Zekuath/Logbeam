import { describe, expect, it } from 'vitest';
import { keepInView, targetLineIndex } from '../src/lib/navigation';

describe('keepInView', () => {
  const ROW_HEIGHT = 20;
  const CLIENT_HEIGHT = 200; // 10 rows visible

  it('keeps current scroll if row is already in view', () => {
    // Rows 0 to 9 are in view with scrollTop = 0
    expect(keepInView(0, ROW_HEIGHT, 0, CLIENT_HEIGHT)).toBe(0);
    expect(keepInView(5, ROW_HEIGHT, 0, CLIENT_HEIGHT)).toBe(0);
    expect(keepInView(9, ROW_HEIGHT, 0, CLIENT_HEIGHT)).toBe(0);
  });

  it('scrolls up if row is above the viewport', () => {
    // Current viewport is rows 10 to 19 (scrollTop = 200)
    expect(keepInView(5, ROW_HEIGHT, 200, CLIENT_HEIGHT)).toBe(100);
    expect(keepInView(0, ROW_HEIGHT, 200, CLIENT_HEIGHT)).toBe(0);
  });

  it('scrolls down if row is below the viewport', () => {
    // Current viewport is rows 0 to 9 (scrollTop = 0)
    // Row 10 top is 200, bottom is 220 -> needs scrollTop = 220 - 200 = 20
    expect(keepInView(10, ROW_HEIGHT, 0, CLIENT_HEIGHT)).toBe(20);
    // Row 15 bottom is 320 -> needs scrollTop = 320 - 200 = 120
    expect(keepInView(15, ROW_HEIGHT, 0, CLIENT_HEIGHT)).toBe(120);
  });

  it('never returns negative scroll', () => {
    expect(keepInView(0, ROW_HEIGHT, 0, 1000)).toBe(0);
  });

  it('returns current scrollTop when clientHeight is non-positive', () => {
    expect(keepInView(5, ROW_HEIGHT, 150, 0)).toBe(150);
    expect(keepInView(5, ROW_HEIGHT, 150, -10)).toBe(150);
  });
});

describe('targetLineIndex', () => {
  it('returns -1 for empty list', () => {
    expect(targetLineIndex(-1, 1, 0)).toBe(-1);
    expect(targetLineIndex(0, 1, 0)).toBe(-1);
  });

  it('navigates next and previous when a line is selected', () => {
    expect(targetLineIndex(0, 1, 10)).toBe(1);
    expect(targetLineIndex(1, -1, 10)).toBe(0);
    expect(targetLineIndex(5, 1, 10)).toBe(6);
    expect(targetLineIndex(5, -1, 10)).toBe(4);
  });

  it('clamps at boundaries', () => {
    expect(targetLineIndex(0, -1, 10)).toBe(0);
    expect(targetLineIndex(9, 1, 10)).toBe(9);
  });

  it('selects top visible line on forward navigation when nothing is selected', () => {
    expect(targetLineIndex(-1, 1, 50, 0)).toBe(0);
    expect(targetLineIndex(-1, 1, 50, 25)).toBe(25);
  });

  it('selects line before top visible on backward navigation when nothing is selected', () => {
    expect(targetLineIndex(-1, -1, 50, 0)).toBe(0);
    expect(targetLineIndex(-1, -1, 50, 25)).toBe(24);
  });
});
