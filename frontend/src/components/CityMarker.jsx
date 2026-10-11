import { useRef } from "react";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";

const pinIcon = L.divIcon({
    className: "",
    html: `<div style="
        width:14px;height:14px;
        background:#28254F;
        border:2px solid #ffffff;
        border-radius:50%;
    "></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -10],
});

export default function CityMarker({ hotspot, isMobile, onSelect }) {
    const markerRef = useRef(null);

    return (
        <Marker
            position={[hotspot.lat, hotspot.lng]}
            icon={pinIcon}
            ref={markerRef}
            eventHandlers={{
                mouseover: !isMobile ? () => markerRef.current?.openPopup() : undefined,
                click: isMobile ? () => onSelect(hotspot) : undefined,
            }}
        >
            {!isMobile && (
                <Popup>
                    <strong>{hotspot.name}</strong>
                    <p>{hotspot.description}</p>
                </Popup>
            )}
        </Marker>
    );
}
