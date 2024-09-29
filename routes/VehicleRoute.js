const { Router } = require("express");
const VehicleController = require("../controllers/VehicleController");
const middleware = require("../middleware/middlewareController");
const router = Router();

// http://localhost:3000/api/v1/vehicle/GetAllVehicles
router.get("/GetAllVehicles", middleware.verifyToken , VehicleController.GetAllVehicles);

// http://localhost:3000/api/v1/vehicle/GetVehicleById
router.get("/GetVehicleById", middleware.verifyToken , VehicleController.GetVehicleById);

// http://localhost:3000/api/v1/vehicle/GetVehicleByCustomerId
router.get("/GetVehicleByCustomerId", middleware.verifyToken , VehicleController.GetVehicleByCustomerId);

// Đảm bảo bạn export router đúng cách
module.exports = router;