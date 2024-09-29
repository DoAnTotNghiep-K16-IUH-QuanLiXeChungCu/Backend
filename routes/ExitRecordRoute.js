const { Router } = require("express");
const ExitRecordController = require("../controllers/ExitRecordController");
const middleware = require("../middleware/middlewareController");
const router = Router();

// http://localhost:3000/api/v1/entryRecord/GetAllExitRecords
router.get("/GetAllExitRecords", middleware.verifyToken , ExitRecordController.GetAllExitRecords);

// http://localhost:3000/api/v1/entryRecord/GetExitRecordById
router.get("/GetExitRecordById", middleware.verifyToken , ExitRecordController.GetExitRecordById);

// http://localhost:3000/api/v1/entryRecord/GetExitRecordByEntryRecordId
router.get("/GetExitRecordByEntryRecordId", middleware.verifyToken , ExitRecordController.GetExitRecordByEntryRecordId);

// http://localhost:3000/api/v1/entryRecord/GetExitRecordByLicensePlate
router.get("/GetExitRecordByLicensePlate", middleware.verifyToken , ExitRecordController.GetExitRecordByLicensePlate);

// Đảm bảo bạn export router đúng cách
module.exports = router;
