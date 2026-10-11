import { useEffect, useState } from "react";
import { directionsUrl } from "../lib/hotspots";
import "./HotspotCard.css";

const DISMISS_PX = 90;

/**
 * One card for both layouts: a bottom sheet on touch, a floating panel with a
 * mouse. Keeping it as a single component means the mobile-first work applies
 * to desktop automatically, instead of two code paths drifting apart.
 */
export default function HotspotCard({ hotspot, open, onClose, coarse }) {
    // Held as state, not a ref: the offset is rendered, and a ref cannot be
    // read during render. `null` means no gesture is in progress.
    const [drag, setDrag] = useState(null);

    useEffect(() => {
        if (!open) return;
        const onKeyDown = event => {
            if (event.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [open, onClose]);

    // Swipe down to dismiss — the gesture people already expect from a sheet.
    const handlePointerDown = event => {
        if (!coarse) return;
        event.currentTarget.setPointerCapture?.(event.pointerId);
        setDrag({ startY: event.clientY, dy: 0 });
    };

    const handlePointerMove = event => {
        if (!drag) return;
        // Downward only; dragging up must not detach the sheet from the edge.
        setDrag({ ...drag, dy: Math.max(0, event.clientY - drag.startY) });
    };

    const handlePointerUp = () => {
        if (!drag) return;
        const travelled = drag.dy;
        setDrag(null);
        if (travelled > DISMISS_PX) onClose();
    };

    const dragY = drag?.dy ?? 0;
    const dragging = drag !== null;

    return (
        <div
            className={`card-layer ${open ? "open" : ""} ${coarse ? "sheet" : "panel"}`}
            // Hidden from assistive tech when closed, since the node stays
            // mounted so that it can animate.
            aria-hidden={!open}
        >
            <div className="card-backdrop" onClick={onClose} />

            <article
                className="card"
                role="dialog"
                aria-modal="false"
                aria-label={hotspot ? `${hotspot.name}, ${hotspot.city}` : undefined}
                style={dragY ? { transform: `translateY(${dragY}px)` } : undefined}
                data-dragging={dragging ? "true" : undefined}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
            >
                <div className="card-grabber" aria-hidden="true" />

                <button type="button" className="card-close" onClick={onClose} aria-label="Close">
                    <svg viewBox="0 0 20 20" aria-hidden="true">
                        <line x1="5" y1="5" x2="15" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        <line x1="15" y1="5" x2="5" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                </button>

                {hotspot && (
                    <>
                        <p className="card-eyebrow">
                            <span className="card-flame" aria-hidden="true">●</span>
                            Hottest in {hotspot.city}
                        </p>

                        <h2 className="card-name">{hotspot.name}</h2>

                        <p className="card-meta">
                            {hotspot.cuisine}
                            {hotspot.neighborhood && <span className="card-dot"> · </span>}
                            {hotspot.neighborhood}
                        </p>

                        <p className="card-description">{hotspot.description}</p>

                        <a
                            className="card-directions"
                            href={directionsUrl(hotspot)}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Directions
                            <svg viewBox="0 0 16 16" aria-hidden="true">
                                <path d="M4 12L12 4M12 4H6M12 4v6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </a>
                    </>
                )}
            </article>
        </div>
    );
}
