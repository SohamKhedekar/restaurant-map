import { useEffect, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import CityMarker from "./CityMarker";
import BottomSheet from "./BottomSheet";
import "../styles/map.css";
import { useIsMobile } from "../hooks/useIsMobile";

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
    const [cities, setCities] = useState([]);
    const [selected, setSelected] = useState(null);
    const [sheetOpen, setSheetOpen] = useState(false);
    
    const isMobile = useIsMobile();

    useEffect(() => {
        fetch("/cities.json")
            .then(res => res.json())
            .then(data => setCities(data));
    }, []);

    const handleCitySelect = async (city) => {
        const res = await fetch(`/api/restaurants?city=${city}`);
        const data = await res.json();

        setSelected(data);
        setSheetOpen(true);
    };

    return (
        <>
            <MapContainer center={[20, 0]} zoom={2} id="map">
            <GeolocateOnLoad />
            <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
            />

            {cities.map(city => (
                <CityMarker
                    key={city.name}
                    city={city}
                    isMobile={isMobile}
                    onSelect={handleCitySelect}
                />
            ))}
            </MapContainer>

            {/* Mobile bottom sheet */}
            {isMobile && (
                <BottomSheet
                    key={selected?.restaurant ?? "empty"}
                    open={sheetOpen}
                    onClose={() => setSheetOpen(false)}
                    restaurant={selected}
                />
            )}
        </>
    );
}
