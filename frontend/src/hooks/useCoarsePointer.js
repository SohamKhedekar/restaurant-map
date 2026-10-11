import { useSyncExternalStore } from "react";

const QUERY = "(pointer: coarse)";

function subscribe(onChange) {
    const mql = window.matchMedia(QUERY);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
}

const getSnapshot = () => window.matchMedia(QUERY).matches;
const getServerSnapshot = () => false;

/**
 * True when the primary input is touch.
 *
 * Replaces a one-shot `ontouchstart` check, which was wrong twice over: a
 * touchscreen laptop reported as mobile and lost hover entirely, and the value
 * never changed when a window was resized or a device rotated. A media query
 * describes the input device rather than guessing from feature detection.
 *
 * useSyncExternalStore is the right primitive for a browser-owned value: it
 * subscribes without an effect, so there is no window in which React's copy
 * disagrees with the browser's.
 */
export function useCoarsePointer() {
    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
