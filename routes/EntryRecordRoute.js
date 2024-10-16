const { Router } = require("express");
const EntryRecordController = require("../controllers/EntryRecordController");
const middleware = require("../middleware/middlewareController");
const router = Router();

// http://localhost:3000/api/v1/entryRecord/GetAllEntryRecords
router.patch("/GetAllEntryRecords", middleware.verifyToken , EntryRecordController.GetAllEntryRecords);

// http://localhost:3000/api/v1/entryRecord/GetEntryRecordById
router.patch("/GetEntryRecordById", middleware.verifyToken , EntryRecordController.GetEntryRecordById);

// http://localhost:3000/api/v1/entryRecord/GetEntryRecordByLicensePlate
router.patch("/GetEntryRecordByLicensePlate", middleware.verifyToken , EntryRecordController.GetEntryRecordByLicensePlate);

// http://localhost:3000/api/v1/entryRecord/GetEntryRecordsByDateRange
router.patch("/GetEntryRecordsByDateRange", middleware.verifyToken , EntryRecordController.GetEntryRecordsByDateRange);

// http://localhost:3000/api/v1/entryRecord/GetEntryRecordsByVehicleType
router.patch("/GetEntryRecordsByVehicleType", middleware.verifyToken , EntryRecordController.GetEntryRecordsByVehicleType);

// http://localhost:3000/api/v1/entryRecord/CountVehicleEntry
router.patch("/CountVehicleEntry", middleware.verifyToken , EntryRecordController.CountVehicleEntry);

// http://localhost:3000/api/v1/entryRecord/CreateEntryRecord
router.post("/CreateEntryRecord", middleware.verifyToken , EntryRecordController.CreateEntryRecord);

// http://localhost:3000/api/v1/entryRecord/CountVehicleNonExit
router.get("/CountVehicleNonExit", middleware.verifyToken , EntryRecordController.CountVehicleNonExit);

// http://localhost:3000/api/v1/entryRecord/FilterEntryRecords
router.patch("/FilterEntryRecords", middleware.verifyToken , EntryRecordController.FilterEntryRecords);

// Đảm bảo bạn export router đúng cách
module.exports = router; 
