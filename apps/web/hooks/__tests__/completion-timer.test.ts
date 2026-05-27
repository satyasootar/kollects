import { renderHook, act } from "@testing-library/react";
import { useCompletionTimer } from "../use-completion-timer";

describe("useCompletionTimer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts at 0 seconds", () => {
    const { result } = renderHook(() => useCompletionTimer());
    expect(result.current.seconds).toBe(0);
  });

  it("counts seconds after start", () => {
    const { result } = renderHook(() => useCompletionTimer());
    act(() => result.current.start());
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(result.current.seconds).toBe(3);
  });

  it("stops counting after stop", () => {
    const { result } = renderHook(() => useCompletionTimer());
    act(() => result.current.start());
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    let finalSeconds: number | undefined;
    act(() => {
      finalSeconds = result.current.stop();
    });
    expect(finalSeconds).toBe(5);
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(result.current.seconds).toBe(5); // doesn't increase
  });

  it("does not start twice", () => {
    const { result } = renderHook(() => useCompletionTimer());
    act(() => result.current.start());
    act(() => result.current.start()); // second call is no-op
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.seconds).toBe(2);
  });
});
