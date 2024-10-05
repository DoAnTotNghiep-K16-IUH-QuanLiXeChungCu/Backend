const { Router } = require("express");
const ParkingSlotController = require("../controllers/ParkingSlotController");
const middleware = require("../middleware/middlewareController");
const router = Router();

// http://localhost:3000/api/v1/parkingSlot/GetAllParkingSlots
router.get("/GetAllParkingSlots", middleware.verifyToken , ParkingSlotController.GetAllParkingSlots);

// http://localhost:3000/api/v1/parkingSlot/GetParkingSlotById
router.get("/GetParkingSlotById", middleware.verifyToken , ParkingSlotController.GetParkingSlotById);

// http://localhost:3000/api/v1/parkingSlot/CreateParkingSlot
router.get("/CreateParkingSlot", middleware.verifyToken , ParkingSlotController.CreateParkingSlot);

// http://localhost:3000/api/v1/parkingSlot/GetAvailableParkingSlotsByType
router.get("/GetAvailableParkingSlotsByType", middleware.verifyToken , ParkingSlotController.GetAvailableParkingSlotsByType);

// http://localhost:3000/api/v1/parkingSlot/GetAvailableParkingSlotsByTypeAndCode
router.get("/GetAvailableParkingSlotsByTypeAndCode", middleware.verifyToken , ParkingSlotController.GetAvailableParkingSlotsByTypeAndCode);

// Đảm bảo bạn export router đúng cách
module.exports = router;