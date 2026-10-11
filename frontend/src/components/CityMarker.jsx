import { useMemo } from "react";
import { Marker } from "react-leaflet";
import L from "leaflet";

/**
 * Leaflet sizes the clickable area to the icon, so the icon is a 44px square
 * with a small dot drawn at its centre. The target meets the touch-size
 * guidance without a 44px blob appearing on the map.
 */
const ICON_SIZE = 44;

function buildIcon(active) {
    return L.divIcon({
        className: "pin-icon",
        html: `<span class="pin ${active ? "pin-active" : ""}"><span class="pin-dot"></span></span>`,
        iconSize: [ICON_SIZE, ICON_SIZE],
        iconAnchor: [ICON_SIZE / 2, ICON_SIZE / 2],
    });
}

const idleIcon = buildIcon(false);
const activeIcon = buildIcon(true);

export default function CityMarker({ hotspot, active, onSelect }) {
    // Click on every input type: one interaction model, and hover-only content
    // is unreachable on a touchscreen anyway.
    const handlers = useMemo(
        () => ({ click: () => onSelect(hotspot) }),
        [hotspot, onSelect]
    );

    return (
        <Marker
            position={[hotspot.lat, hotspot.lng]}
            icon={active ? activeIcon : idleIcon}
            eventHandlers={handlers}
            // Read out by screen readers and shown as a native tooltip.
            title={`${hotspot.name} — ${hotspot.city}`}
            keyboard
            alt={`${hotspot.name} in ${hotspot.city}`}
        />
    );
}
