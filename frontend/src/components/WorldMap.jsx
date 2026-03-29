import { useEffect, useState } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import CityMarker from "./CityMarker";
import BottomSheet from "./BottomSheet";
import "../styles/map.css";
import { useIsMobile } from "../hooks/useIsMobile";

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
        const res = await fetch(
            `http://192.168.1.156:3001/api/restaurants?city=${city}`
        );
        const data = await res.json();

        setSelected(data);
        setSheetOpen(true);
    };

    return (
        <>
            <MapContainer center={[20, 0]} zoom={2} id="map">
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
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
