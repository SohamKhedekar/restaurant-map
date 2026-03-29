import { useState, useRef } from "react";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { getRestaurantByCity } from "../api/restaurants";

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

export default function CityMarker({ city, isMobile, onSelect }) {
    const [restaurant, setRestaurant] = useState(null);
    const markerRef = useRef(null);

    const handleDesktop = async () => {
        if (restaurant) {
            markerRef.current?.openPopup();
            return;
        }
        const res = await getRestaurantByCity(city.name);
        setRestaurant(res.data);
        markerRef.current?.openPopup();
    };

    const handleMobile = () => {
        onSelect(city.name);
    };

    return (
        <Marker
            position={[city.lat, city.lng]}
            icon={pinIcon}
            ref={markerRef}
            eventHandlers={{
                mouseover: !isMobile ? handleDesktop : undefined,
                click: isMobile ? handleMobile : undefined,
            }}
        >
            {!isMobile && restaurant && (
                <Popup>
                    <strong>{restaurant.restaurant}</strong>
                    <p>{restaurant.description}</p>
                </Popup>
            )}
        </Marker>
    );
}
