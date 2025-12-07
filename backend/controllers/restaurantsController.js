const data = require("../data/staticRestaurants.json");

exports.getRestaurantsByCity = (req, res) => {
    const city = req.query.city;

    const entry = data.find(d => d.city.toLowerCase() === city.toLowerCase());

    if (!entry) {
    return res.json({
        success: false,
        message: "No restaurant found for this city."
    });
    }

    res.json({
        success: true,
        data: entry
    });
};
