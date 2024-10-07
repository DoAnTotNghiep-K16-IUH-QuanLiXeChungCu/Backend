const { Router } = require("express");
const ShiftController = require("../controllers/shiftController");
const middleware = require("../middleware/middlewareController");
const router = Router();

// http://localhost:3000/api/v1/shift/GetAllShifts
router.patch("/GetAllShifts", middleware.verifyToken , ShiftController.GetAllShifts);

// http://localhost:3000/api/v1/shift/UpdateShift
router.put("/UpdateShift", middleware.verifyToken , ShiftController.UpdateShift);

// http://localhost:3000/api/v1/shift/GetShiftById
router.patch("/GetShiftById", middleware.verifyToken , ShiftController.GetShiftById);

// Api
module.exports = router;