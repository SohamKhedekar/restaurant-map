export async function getRestaurantByCity(city) {
    const res = await fetch(`/api/restaurants?city=${city}`);
    return res.json();
}
  