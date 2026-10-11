import { useEffect, useState } from "react";
import "./PrivacyNote.css";

/**
 * A short, literally accurate privacy note.
 *
 * Worth stating plainly because it is unusually true here: the app has no
 * server, so a visitor's coordinates genuinely cannot leave their device.
 * Keep the wording in step with the code — if anything ever starts sending
 * data anywhere, this has to change first.
 */
export default function PrivacyNote() {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (!open) return;
        const onKeyDown = event => {
            if (event.defaultPrevented) return;
            if (event.key === "Escape") setOpen(false);
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [open]);

    return (
        <>
            <button
                type="button"
                className="privacy-trigger"
                onClick={() => setOpen(true)}
                aria-haspopup="dialog"
            >
                Privacy
            </button>

            {open && (
                <div className="privacy-layer" role="dialog" aria-modal="true" aria-label="Privacy">
                    <div className="privacy-backdrop" onClick={() => setOpen(false)} />

                    <div className="privacy-panel">
                        <button
                            type="button"
                            className="privacy-close"
                            onClick={() => setOpen(false)}
                            aria-label="Close"
                        >
                            <svg viewBox="0 0 20 20" aria-hidden="true">
                                <line x1="5" y1="5" x2="15" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                <line x1="15" y1="5" x2="5" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </button>

                        <h2>Privacy</h2>

                        <p>
                            No accounts, no analytics, no tracking. Nothing you do here is
                            recorded.
                        </p>
                        <p>
                            If you allow location access, your coordinates stay in your
                            browser&rsquo;s local storage and are used only to find the hotspot
                            nearest you. They are never sent to us — there is no server to
                            send them to.
                        </p>
                        <p>
                            As with any website, the host and the map tile provider (Esri) can
                            see your IP address. Choosing <strong>Directions</strong> opens
                            Google Maps in a new tab.
                        </p>
                    </div>
                </div>
            )}
        </>
    );
}
