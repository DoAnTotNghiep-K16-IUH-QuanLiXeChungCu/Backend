const { Router } = require("express");
const UserShiftController = require("../controllers/UserShiftController");
const middleware = require("../middleware/middlewareController");
const router = Router();

// http://localhost:3000/api/v1/userShift/GetAllUserShifts
router.patch("/GetAllUserShifts", middleware.verifyToken , UserShiftController.GetAllUserShifts);

// http://localhost:3000/api/v1/userShift/GetAllUserShifts
router.post("/CreateUserShift", middleware.verifyToken , UserShiftController.CreateUserShift);

// http://localhost:3000/api/v1/userShift/UpdateUserShift
router.put("/UpdateUserShift", middleware.verifyToken , UserShiftController.UpdateUserShift);

// http://localhost:3000/api/v1/userShift/UpdateUserShift
router.delete("/DeleteUserShift", middleware.verifyToken , UserShiftController.DeleteUserShift);

// http://localhost:3000/api/v1/userShift/GetUserShiftsByUserIdAndDateRange
router.patch("/GetUserShiftsByUserIdAndDateRange", middleware.verifyToken , UserShiftController.GetUserShiftsByUserIdAndDateRange);

// http://localhost:3000/api/v1/userShift/FilterUserShift
router.patch("/FilterUserShift", middleware.verifyToken , UserShiftController.FilterUserShift);

// API 
module.exports = router;
