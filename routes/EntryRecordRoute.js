const { Router } = require("express");
const EntryRecordController = require("../controllers/EntryRecordController");
const middleware = require("../middleware/middlewareController");
const router = Router();

// http://localhost:3000/api/v1/entryRecord/getAllRecords
router.get("/getAllRecords", middleware.verifyToken , EntryRecordController.GetAllRecords);

// Đảm bảo bạn export router đúng cách
module.exports = router;
