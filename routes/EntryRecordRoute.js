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

// Đảm bảo bạn export router đúng cách
module.exports = router;