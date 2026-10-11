import { useCallback, useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import CityMarker from "./CityMarker";
import BottomSheet from "./BottomSheet";
import NearMeButton from "./NearMeButton";
import "../styles/map.css";
import { useIsMobile } from "../hooks/useIsMobile";
import { useGeolocation, readCachedLocation } from "../hooks/useGeolocation";
import { allHotspots } from "../lib/hotspots";
import { nearestHotspot } from "../lib/geo";

const WORLD_VIEW = { center: [20, 0], zoom: 2 };
const CITY_ZOOM = 12;
/**
 * Past this, "nearest" stops being meaningful — someone in Europe is closest to
 * New York, and flying there would be a worse first impression than the world
 * view. The button still works if they ask for it explicitly.
 */
const MAX_AUTO_FLY_KM = 250;

/** Flies the map whenever `target` changes. Must live inside <MapContainer>. */
function FlyTo({ target, zoom }) {
    const map = useMap();
    useEffect(() => {
        if (target) map.flyTo([target.lat, target.lng], zoom, { duration: 1.2 });
    }, [map, target, zoom]);
    return null;
}

/** The nearest hotspot to a point, or null if nothing is close enough. */
function nearbyHotspot(coords) {
    if (!coords) return null;
    const near = nearestHotspot(coords);
    return near && near.km <= MAX_AUTO_FLY_KM ? near.hotspot : null;
}

export default function WorldMap() {
    // A cached fix is known before the first paint, so the opening view is
    // derived here rather than corrected afterwards in an effect. A returning
    // visitor never sees the world view flash before the map jumps.
    const [initial] = useState(() => nearbyHotspot(readCachedLocation()));

    const [selected, setSelected] = useState(initial);
    const [sheetOpen, setSheetOpen] = useState(Boolean(initial));
    // Left null on purpose: the map already opens centred on `initial`, so
    // there is nothing to animate towards yet.
    const [flyTarget, setFlyTarget] = useState(null);

    const isMobile = useIsMobile();

    // The automatic jump happens once. After that the map is the user's to
    // move, and a late or refreshed fix must not yank it back.
    const autoFlown = useRef(Boolean(initial));

    const goToHotspot = useCallback((hotspot) => {
        setSelected(hotspot);
        setSheetOpen(true);
        setFlyTarget({ lat: hotspot.lat, lng: hotspot.lng });
    }, []);

    // Runs inside the geolocation callback, not an effect.
    const handleFix = useCallback((coords) => {
        if (autoFlown.current) return;
        const hotspot = nearbyHotspot(coords);
        if (!hotspot) return;
        autoFlown.current = true;
        goToHotspot(hotspot);
    }, [goToHotspot]);

    const { status, request, getCoords } = useGeolocation({ onFix: handleFix });

    // An explicit tap always acts, even if we already flew once.
    const handleNearMe = useCallback(() => {
        const hotspot = nearbyHotspot(getCoords());
        if (hotspot) goToHotspot(hotspot);
        else request();
    }, [getCoords, goToHotspot, request]);

    return (
        <>
            <MapContainer
                center={initial ? [initial.lat, initial.lng] : WORLD_VIEW.center}
                zoom={initial ? CITY_ZOOM : WORLD_VIEW.zoom}
                id="map"
            >
                <FlyTo target={flyTarget} zoom={CITY_ZOOM} />
                {/* Esri Dark Gray Canvas: free, no API key. CARTO's basemaps now
                    require a key and serve a watermarked tile instead of erroring.
                    Esri splits the style in two — geometry, then labels on top. */}
                <TileLayer
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
                    attribution='Tiles &copy; <a href="https://www.esri.com/">Esri</a> &mdash; Esri, HERE, Garmin, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    maxZoom={16}
                />
                <TileLayer
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}"
                    maxZoom={16}
                />

                {allHotspots.map(hotspot => (
                    <CityMarker
                        key={hotspot.city}
                        hotspot={hotspot}
                        isMobile={isMobile}
                        onSelect={goToHotspot}
                    />
                ))}
            </MapContainer>

            <NearMeButton status={status} onClick={handleNearMe} />

            {/* Mobile bottom sheet */}
            {isMobile && (
                <BottomSheet
                    open={sheetOpen}
                    onClose={() => setSheetOpen(false)}
                    hotspot={selected}
                />
            )}
        </>
    );
}
