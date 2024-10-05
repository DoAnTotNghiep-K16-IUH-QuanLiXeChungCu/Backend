const { Router } = require("express");
const EntryRecordController = require("../controllers/EntryRecordController");
const middleware = require("../middleware/middlewareController");
const router = Router();

// http://localhost:3000/api/v1/entryRecord/GetAllEntryRecords
router.get("/GetAllEntryRecords", middleware.verifyToken , EntryRecordController.GetAllEntryRecords);

// http://localhost:3000/api/v1/entryRecord/GetEntryRecordById
router.get("/GetEntryRecordById", middleware.verifyToken , EntryRecordController.GetEntryRecordById);

// http://localhost:3000/api/v1/entryRecord/GetEntryRecordByLicensePlate
router.get("/GetEntryRecordByLicensePlate", middleware.verifyToken , EntryRecordController.GetEntryRecordByLicensePlate);

// http://localhost:3000/api/v1/entryRecord/GetEntryRecordsByDateRange
router.get("/GetEntryRecordsByDateRange", middleware.verifyToken , EntryRecordController.GetEntryRecordsByDateRange);

// http://localhost:3000/api/v1/entryRecord/GetEntryRecordsByVehicleType
router.get("/GetEntryRecordsByVehicleType", middleware.verifyToken , EntryRecordController.GetEntryRecordsByVehicleType);

// http://localhost:3000/api/v1/entryRecord/CountVehicleEntry
router.get("/CountVehicleEntry", middleware.verifyToken , EntryRecordController.CountVehicleEntry);

// http://localhost:3000/api/v1/entryRecord/CreateEntryRecord
router.post("/CreateEntryRecord", middleware.verifyToken , EntryRecordController.CreateEntryRecord);

// Đảm bảo bạn export router đúng cách
module.exports = router; 
