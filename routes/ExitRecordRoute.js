const { Router } = require("express");
const ExitRecordController = require("../controllers/ExitRecordController");
const middleware = require("../middleware/middlewareController");
const router = Router();

// http://localhost:3000/api/v1/entryRecord/GetAllExitRecords
router.patch("/GetAllExitRecords", middleware.verifyToken , ExitRecordController.GetAllExitRecords);

// http://localhost:3000/api/v1/entryRecord/GetExitRecordById
router.patch("/GetExitRecordById", middleware.verifyToken , ExitRecordController.GetExitRecordById);

// http://localhost:3000/api/v1/entryRecord/GetExitRecordByEntryRecordId
router.patch("/GetExitRecordByEntryRecordId", middleware.verifyToken , ExitRecordController.GetExitRecordByEntryRecordId);

// http://localhost:3000/api/v1/entryRecord/GetExitRecordByLicensePlate
router.patch("/GetExitRecordByLicensePlate", middleware.verifyToken , ExitRecordController.GetExitRecordByLicensePlate);

// http://localhost:3000/api/v1/entryRecord/GetExitRecordsByDateRange
router.patch("/GetExitRecordsByDateRange", middleware.verifyToken , ExitRecordController.GetExitRecordsByDateRange);

// http://localhost:3000/api/v1/entryRecord/GetExitRecordsByVehicleType
router.patch("/GetExitRecordsByVehicleType", middleware.verifyToken , ExitRecordController.GetExitRecordsByVehicleType);

// http://localhost:3000/api/v1/entryRecord/CountVehicleExitRecord
router.patch("/CountVehicleExitRecord", middleware.verifyToken , ExitRecordController.CountVehicleExitRecord);

// http://localhost:3000/api/v1/entryRecord/CreateExitRecord
router.post("/CreateExitRecord", middleware.verifyToken , ExitRecordController.CreateExitRecord);

// Đảm bảo bạn export router đúng cách
module.exports = router;
