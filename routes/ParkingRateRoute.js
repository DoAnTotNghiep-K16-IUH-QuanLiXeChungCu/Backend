const { Router } = require("express");
const ParkingRateController = require("../controllers/ParkingRateController");
const middleware = require("../middleware/middlewareController");
const router = Router();

// http://localhost:3000/api/v1/parkingRate/GetAllParkingRates
router.patch("/GetAllParkingRates", middleware.verifyToken , ParkingRateController.GetAllParkingRates);

// http://localhost:3000/api/v1/parkingRate/CreateParkingRate
router.post("/CreateParkingRate", middleware.verifyToken , ParkingRateController.CreateParkingRate);

// http://localhost:3000/api/v1/parkingRate/UpdateParkingRate
router.put("/UpdateParkingRate", middleware.verifyToken , ParkingRateController.UpdateParkingRate);

// http://localhost:3000/api/v1/parkingRate/GetParkingRateById
router.patch("/GetParkingRateById", middleware.verifyToken , ParkingRateController.GetParkingRateById);

// http://localhost:3000/api/v1/parkingRate/DeleteParkingRate
router.delete("/DeleteParkingRate", middleware.verifyToken , ParkingRateController.DeleteParkingRate);

// Đảm bảo bạn export router đúng cách
module.exports = router;