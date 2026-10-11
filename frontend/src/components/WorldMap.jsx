import { useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { AttributionControl, MapContainer, TileLayer, useMap } from "react-leaflet";
import CityMarker from "./CityMarker";
import HotspotCard from "./HotspotCard";
import NearMeButton from "./NearMeButton";
import "../styles/map.css";
import { useCoarsePointer } from "../hooks/useCoarsePointer";
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

/**
 * Flies the map whenever `target` changes, biased so the pin lands in the part
 * of the map the card is not covering. Shifting the projected centre moves the
 * pin the opposite way on screen: +y puts it above centre, +x puts it left.
 * Must live inside <MapContainer>.
 */
function FlyTo({ target, zoom, offsetX = 0, offsetY = 0 }) {
    const map = useMap();
    useEffect(() => {
        if (!target) return;

        let destination = [target.lat, target.lng];
        if (offsetX || offsetY) {
            const centre = map.project(destination, zoom).add([offsetX, offsetY]);
            destination = map.unproject(centre, zoom);
        }
        map.flyTo(destination, zoom, { duration: 1.2 });
    }, [map, target, zoom, offsetX, offsetY]);
    return null;
}

/** Roughly how much of the viewport each layout's card hides. */
function cardOffset(coarse) {
    if (typeof window === "undefined") return { offsetX: 0, offsetY: 0 };
    return coarse
        // The sheet sits along the bottom edge.
        ? { offsetX: 0, offsetY: Math.min(window.innerHeight * 0.2, 170) }
        // The panel sits on the right; nudge the pin into the clear left side.
        : { offsetX: Math.min(window.innerWidth * 0.14, 190), offsetY: 0 };
}

/** The nearest hotspot to a point, or null if nothing is close enough. */
function nearbyHotspot(coords) {
    if (!coords) return null;
    const near = nearestHotspot(coords);
    return near && near.km <= MAX_AUTO_FLY_KM ? near.hotspot : null;
}

export default function WorldMap({ ref }) {
    // A cached fix is known before the first paint, so the opening view is
    // derived here rather than corrected afterwards in an effect. A returning
    // visitor never sees the world view flash before the map jumps.
    const [initial] = useState(() => nearbyHotspot(readCachedLocation()));

    const [selected, setSelected] = useState(initial);
    const [cardOpen, setCardOpen] = useState(Boolean(initial));
    // Set even for the opening view: the map centres on `initial`, but the pin
    // still has to be nudged clear of the card, so there is a short correction
    // rather than nothing to do.
    const [flyTarget, setFlyTarget] = useState(
        initial ? { lat: initial.lat, lng: initial.lng } : null
    );

    const coarse = useCoarsePointer();
    const { offsetX, offsetY } = cardOffset(coarse);

    // The automatic jump happens once. After that the map is the user's to
    // move, and a late or refreshed fix must not yank it back.
    const autoFlown = useRef(Boolean(initial));

    const goToHotspot = useCallback((hotspot) => {
        setSelected(hotspot);
        setCardOpen(true);
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

    // Lets the search in the nav drive the map without lifting map state out
    // of this component. React 19 passes `ref` as an ordinary prop.
    useImperativeHandle(ref, () => ({
        goToHotspot(hotspot) {
            // A deliberate choice overrides the pending automatic jump.
            autoFlown.current = true;
            goToHotspot(hotspot);
        },
    }), [goToHotspot]);

    // An explicit tap always acts, even if we already flew once.
    const handleNearMe = useCallback(() => {
        const hotspot = nearbyHotspot(getCoords());
        if (hotspot) goToHotspot(hotspot);
        else request();
    }, [getCoords, goToHotspot, request]);

    // `selected` is kept while closing so the card can animate out with its
    // content intact rather than emptying mid-transition.
    const closeCard = useCallback(() => setCardOpen(false), []);

    return (
        <>
            <MapContainer
                center={initial ? [initial.lat, initial.lng] : WORLD_VIEW.center}
                zoom={initial ? CITY_ZOOM : WORLD_VIEW.zoom}
                id="map"
                zoomControl={!coarse}
                attributionControl={false}
            >
                <AttributionControl position="bottomleft" prefix={false} />
                <FlyTo target={flyTarget} zoom={CITY_ZOOM} offsetX={offsetX} offsetY={offsetY} />
                {/* Esri Dark Gray Canvas: free, no API key. CARTO's basemaps now
                    require a key and serve a watermarked tile instead of erroring.
                    Esri splits the style in two — geometry, then labels on top. */}
                <TileLayer
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
                    attribution='&copy; <a href="https://www.esri.com/">Esri</a>, HERE, Garmin, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
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
                        active={cardOpen && selected?.city === hotspot.city}
                        onSelect={goToHotspot}
                    />
                ))}
            </MapContainer>

            <NearMeButton status={status} onClick={handleNearMe} />

            <HotspotCard
                hotspot={selected}
                open={cardOpen}
                onClose={closeCard}
                coarse={coarse}
            />
        </>
    );
}
