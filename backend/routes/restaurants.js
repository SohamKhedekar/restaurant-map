const express = require("express");
const router = express.Router();

const controller = require("../controllers/restaurantsController");

router.get("/", controller.getRestaurantsByCity);

module.exports = router;
