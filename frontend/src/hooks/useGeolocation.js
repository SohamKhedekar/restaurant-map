import { useCallback, useEffect, useRef, useState } from "react";

const CACHE_KEY = "hsit:last-location";
const CACHE_MAX_AGE_MS = 12 * 60 * 60 * 1000; // 12 hours
const TIMEOUT_MS = 4000;

/**
 * Browser storage is unavailable in some private-browsing modes and can throw
 * on access rather than returning null, so every read and write is guarded and
 * the app works fine when it fails.
 */
export function readCachedLocation() {
    try {
        const raw = localStorage.getItem(CACHE_KEY);
        if (!raw) return null;
        const { lat, lng, ts } = JSON.parse(raw);
        if (typeof lat !== "number" || typeof lng !== "number") return null;
        if (Date.now() - ts > CACHE_MAX_AGE_MS) return null;
        return { lat, lng };
    } catch {
        return null;
    }
}

function writeCachedLocation(coords) {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ ...coords, ts: Date.now() }));
    } catch {
        // The cache is an optimisation, not a requirement.
    }
}

/**
 * Geolocation that never blocks first paint.
 *
 * A fresh fix is reported through `onFix` rather than as state the caller
 * watches with an effect: the callback runs inside the geolocation callback,
 * which is where a response from an external system belongs. Callers that need
 * a position at first render read `readCachedLocation()` directly.
 *
 * `status` distinguishes the cases the UI cares about: "prompting" while we
 * wait, "denied" when the user said no (so the button can explain itself), and
 * "unavailable" for a timeout, an error, or a browser without the API.
 */
export function useGeolocation({ auto = true, onFix } = {}) {
    const supported = typeof navigator !== "undefined" && "geolocation" in navigator;

    const [status, setStatus] = useState(() => {
        if (!supported) return "unavailable";
        if (auto) return "prompting";
        return readCachedLocation() ? "cached" : "idle";
    });

    const coordsRef = useRef(readCachedLocation());
    const onFixRef = useRef(onFix);
    const mounted = useRef(true);

    useEffect(() => {
        onFixRef.current = onFix;
    });

    useEffect(() => () => { mounted.current = false; }, []);

    /** Sets state only from the async callbacks, never synchronously. */
    const locate = useCallback(() => {
        if (!supported) return;
        navigator.geolocation.getCurrentPosition(
            ({ coords }) => {
                if (!mounted.current) return;
                const next = { lat: coords.latitude, lng: coords.longitude };
                coordsRef.current = next;
                writeCachedLocation(next);
                setStatus("ready");
                onFixRef.current?.(next);
            },
            err => {
                if (!mounted.current) return;
                setStatus(err.code === err.PERMISSION_DENIED ? "denied" : "unavailable");
            },
            { timeout: TIMEOUT_MS, maximumAge: CACHE_MAX_AGE_MS, enableHighAccuracy: false }
        );
    }, [supported]);

    useEffect(() => {
        if (auto) locate();
    }, [auto, locate]);

    /** For an explicit tap: synchronous feedback is correct in an event handler. */
    const request = useCallback(() => {
        if (!supported) {
            setStatus("unavailable");
            return;
        }
        setStatus("prompting");
        locate();
    }, [supported, locate]);

    return { status, request, getCoords: () => coordsRef.current };
}
