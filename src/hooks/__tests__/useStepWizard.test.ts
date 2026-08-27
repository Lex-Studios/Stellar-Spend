import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStepWizard } from '../useStepWizard';

describe('useStepWizard', () => {
  it('starts on step 1 by default', () => {
    const { result } = renderHook(() => useStepWizard());
    expect(result.current.step).toBe(1);
    expect(result.current.isFirst).toBe(true);
    expect(result.current.isLast).toBe(false);
  });

  it('advances to the next step', () => {
    const { result } = renderHook(() => useStepWizard());
    act(() => result.current.next());
    expect(result.current.step).toBe(2);
    expect(result.current.isFirst).toBe(false);
  });

  it('goes back to the previous step', () => {
    const { result } = renderHook(() => useStepWizard());
    act(() => result.current.next());
    act(() => result.current.back());
    expect(result.current.step).toBe(1);
  });

  it('does not go below step 1', () => {
    const { result } = renderHook(() => useStepWizard());
    act(() => result.current.back());
    expect(result.current.step).toBe(1);
  });

  it('does not go above total steps', () => {
    const { result } = renderHook(() => useStepWizard(3));
    act(() => result.current.next());
    act(() => result.current.next());
    act(() => result.current.next()); // should stay at 3
    expect(result.current.step).toBe(3);
    expect(result.current.isLast).toBe(true);
  });

  it('jumps to a specific step with goTo', () => {
    const { result } = renderHook(() => useStepWizard());
    act(() => result.current.goTo(3));
    expect(result.current.step).toBe(3);
  });

  it('respects custom initialStep', () => {
    const { result } = renderHook(() => useStepWizard(3, 2));
    expect(result.current.step).toBe(2);
  });

  it('isFirst and isLast are correct at boundaries', () => {
    const { result } = renderHook(() => useStepWizard(3));
    act(() => result.current.goTo(3));
    expect(result.current.isFirst).toBe(false);
    expect(result.current.isLast).toBe(true);
  });
});
