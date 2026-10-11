import { useEffect, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import CityMarker from "./CityMarker";
import BottomSheet from "./BottomSheet";
import "../styles/map.css";
import { useIsMobile } from "../hooks/useIsMobile";
import { allHotspots } from "../lib/hotspots";

function GeolocateOnLoad() {
    const map = useMap();
    useEffect(() => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
            ({ coords }) => map.flyTo([coords.latitude, coords.longitude], 10),
            () => {} // denied or unavailable — keep default world view
        );
    }, [map]);
    return null;
}

export default function WorldMap() {
    const [selected, setSelected] = useState(null);
    const [sheetOpen, setSheetOpen] = useState(false);

    const isMobile = useIsMobile();

    const handleCitySelect = (hotspot) => {
        setSelected(hotspot);
        setSheetOpen(true);
    };

    return (
        <>
            <MapContainer center={[20, 0]} zoom={2} id="map">
            <GeolocateOnLoad />
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
                    onSelect={handleCitySelect}
                />
            ))}
            </MapContainer>

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
