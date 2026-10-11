import { useId, useRef, useState } from "react";
import { searchHotspots } from "../lib/search";
import "./Search.css";

export default function Search({ onSelect }) {
    const [query, setQuery] = useState("");
    const [open, setOpen] = useState(false);
    const [active, setActive] = useState(0);
    const inputRef = useRef(null);
    const listId = useId();

    // Derived during render rather than held in state: 100 pre-normalised
    // entries are far too cheap to be worth an effect or a debounce.
    const results = open ? searchHotspots(query) : [];
    const activeIndex = Math.min(active, Math.max(results.length - 1, 0));

    const close = () => {
        setOpen(false);
        setActive(0);
        inputRef.current?.blur();
    };

    const commit = (hotspot) => {
        onSelect(hotspot);
        setQuery("");
        close();
    };

    const handleKeyDown = (event) => {
        if (event.key === "Escape") {
            setQuery("");
            close();
            return;
        }
        if (!results.length) return;

        if (event.key === "ArrowDown") {
            event.preventDefault();
            setActive(i => (i + 1) % results.length);
        } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setActive(i => (i - 1 + results.length) % results.length);
        } else if (event.key === "Enter") {
            event.preventDefault();
            commit(results[activeIndex]);
        }
    };

    const showResults = open && query.trim().length > 0;

    return (
        <div className={`search ${open ? "open" : ""}`}>
            {/* Only rendered while open, and only visible on touch layouts,
                where the panel covers the screen and needs a way out. */}
            {open && <div className="search-backdrop" onPointerDown={close} />}

            <div className="search-bar">
                <svg className="search-icon" viewBox="0 0 20 20" aria-hidden="true">
                    <circle cx="9" cy="9" r="6" fill="none" stroke="currentColor" strokeWidth="2" />
                    <line x1="13.5" y1="13.5" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>

                <input
                    ref={inputRef}
                    type="search"
                    className="search-input"
                    placeholder="Search a city"
                    value={query}
                    onChange={e => { setQuery(e.target.value); setActive(0); setOpen(true); }}
                    onFocus={() => setOpen(true)}
                    onKeyDown={handleKeyDown}
                    role="combobox"
                    aria-expanded={showResults}
                    aria-controls={listId}
                    aria-autocomplete="list"
                    aria-label="Search for a city or restaurant"
                    autoComplete="off"
                    // iOS Safari zooms the page when a focused input is under
                    // 16px, and never zooms back out. The font size is set in
                    // CSS; this stops the keyboard adding its own corrections.
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                />

                {open && (
                    <button type="button" className="search-cancel" onPointerDown={e => { e.preventDefault(); setQuery(""); close(); }}>
                        Cancel
                    </button>
                )}
            </div>

            {open && !query.trim() && (
                <p className="search-hint">Type a city, restaurant or cuisine</p>
            )}

            {showResults && (
                <ul className="search-results" id={listId} role="listbox">
                    {results.map((hotspot, i) => (
                        <li
                            key={hotspot.city}
                            role="option"
                            aria-selected={i === activeIndex}
                            className={`search-result ${i === activeIndex ? "active" : ""}`}
                            // pointerdown fires before the input's blur, so the
                            // list is still mounted when the choice is made.
                            onPointerDown={e => { e.preventDefault(); commit(hotspot); }}
                            onMouseEnter={() => setActive(i)}
                        >
                            <span className="search-result-city">{hotspot.city}</span>
                            <span className="search-result-name">{hotspot.name}</span>
                            <span className="search-result-meta">
                                {hotspot.cuisine}
                                {hotspot.neighborhood ? ` · ${hotspot.neighborhood}` : ""}
                            </span>
                        </li>
                    ))}

                    {results.length === 0 && (
                        <li className="search-empty">No match for “{query.trim()}”</li>
                    )}
                </ul>
            )}
        </div>
    );
}
