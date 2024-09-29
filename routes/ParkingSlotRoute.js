const { Router } = require("express");
const ParkingSlotController = require("../controllers/ParkingSlotController");
const middleware = require("../middleware/middlewareController");
const router = Router();

// http://localhost:3000/api/v1/vehicle/GetAllParkingSlots
router.get("/GetAllParkingSlots", middleware.verifyToken , ParkingSlotController.GetAllParkingSlots);

// Đảm bảo bạn export router đúng cách
module.exports = router;