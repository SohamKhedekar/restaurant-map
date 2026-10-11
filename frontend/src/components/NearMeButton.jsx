import "./NearMeButton.css";

const LABEL = {
    idle: "Near me",
    prompting: "Locating…",
    cached: "Near me",
    ready: "Near me",
    denied: "Location blocked",
    unavailable: "Near me",
};

export default function NearMeButton({ status, onClick }) {
    const busy = status === "prompting";
    const denied = status === "denied";

    return (
        <button
            type="button"
            className="near-me"
            onClick={onClick}
            disabled={busy}
            // Denied is a browser-level setting we cannot undo from script, so
            // say what has to happen instead of silently doing nothing.
            title={denied ? "Enable location for this site in your browser settings" : "Jump to the hotspot nearest you"}
        >
            <span aria-hidden="true" className={`near-me-dot ${busy ? "pulsing" : ""}`} />
            {LABEL[status] ?? "Near me"}
        </button>
    );
}
