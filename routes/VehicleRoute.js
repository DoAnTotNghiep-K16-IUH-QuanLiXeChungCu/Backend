const { Router } = require("express");
const VehicleController = require("../controllers/VehicleController");
const middleware = require("../middleware/middlewareController");
const router = Router();

// http://localhost:3000/api/v1/vehicle/GetAllVehicles
router.patch("/GetAllVehicles", middleware.verifyToken , VehicleController.GetAllVehicles);

// http://localhost:3000/api/v1/vehicle/GetVehicleById
router.patch("/GetVehicleById", middleware.verifyToken , VehicleController.GetVehicleById);

// http://localhost:3000/api/v1/vehicle/GetVehicleByCustomerId
router.patch("/GetVehicleByCustomerId", middleware.verifyToken , VehicleController.GetVehicleByCustomerId);

// http://localhost:3000/api/v1/vehicle/GetVehicleByLicensePlate
router.patch("/GetVehicleByLicensePlate", middleware.verifyToken , VehicleController.GetVehicleByLicensePlate);

// http://localhost:3000/api/v1/vehicle/GetVehiclesByType
router.patch("/GetVehiclesByType", middleware.verifyToken , VehicleController.GetVehiclesByType);

// http://localhost:3000/api/v1/vehicle/GetVehiclesByBrand
router.patch("/GetVehiclesByBrand", middleware.verifyToken , VehicleController.GetVehiclesByBrand);

// http://localhost:3000/api/v1/vehicle/CreateVehicle
router.post("/CreateVehicle", middleware.verifyToken , VehicleController.CreateVehicle);

// http://localhost:3000/api/v1/vehicle/UpdateVehicle
router.put("/UpdateVehicle", middleware.verifyToken , VehicleController.UpdateVehicle);

// http://localhost:3000/api/v1/vehicle/DeleteVehicle
router.delete("/DeleteVehicle", middleware.verifyToken , VehicleController.DeleteVehicle);

// Đảm bảo bạn export router đúng cách
module.exports = router;