import { useState } from "react";
import { Marker, Popup } from "react-leaflet";
import { getRestaurantByCity } from "../api/restaurants";

export default function CityMarker({ city, isMobile, onSelect }) {
    const [restaurant, setRestaurant] = useState(null);

    const handleDesktop = async () => {
        const res = await getRestaurantByCity(city.name);
        setRestaurant(res.data);
    };

    const handleMobile = () => {
        onSelect(city.name);
    };

    return (
        <Marker
            position={[city.lat, city.lng]}
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
