export async function getRestaurantByCity(city) {
    const res = await fetch(`http://localhost:3001/api/restaurants?city=${city}`);
    return res.json();
}
  