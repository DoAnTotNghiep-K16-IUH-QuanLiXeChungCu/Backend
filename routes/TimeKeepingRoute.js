const { Router } = require("express");
const TimeKeepingController = require("../controllers/TimeKeepingController");
const middleware = require("../middleware/middlewareController");
const router = Router();

// http://localhost:3000/api/v1/TimeKeeping/GetAllTimeKeeping
router.patch(
  "/GetAllTimeKeeping",
  middleware.verifyToken,
  TimeKeepingController.GetAllTimeKeepings
);

// http://localhost:3000/api/v1/TimeKeeping/GetAllTimeKeeping
router.post(
  "/CreateTimeKeeping",
  middleware.verifyToken,
  TimeKeepingController.CreateTimeKeeping
);

// http://localhost:3000/api/v1/TimeKeeping/UpdateTimeKeeping
router.put(
  "/UpdateTimeKeeping",
  middleware.verifyToken,
  TimeKeepingController.UpdateTimeKeeping
);

// http://localhost:3000/api/v1/TimeKeeping/UpdateTimeKeeping
router.delete(
  "/DeleteTimeKeeping",
  middleware.verifyToken,
  TimeKeepingController.DeleteTimeKeeping
);

// http://localhost:3000/api/v1/TimeKeeping/GetTimeKeepingByUserIdAndDateRange
router.patch(
  "/GetTimeKeepingByUserIdAndDateRange",
  middleware.verifyToken,
  TimeKeepingController.GetTimeKeepingsByUserIdAndDateRange
);

// http://localhost:3000/api/v1/TimeKeeping/FilterTimeKeeping
router.patch(
  "/FilterTimeKeeping",
  middleware.verifyToken,
  TimeKeepingController.FilterTimeKeeping
);

// http://localhost:3000/api/v1/TimeKeeping/GetTimeKeepingByUserIdAndShiftIdAndDateTime
router.patch(
  "/GetTimeKeepingByUserIdAndShiftIdAndDateTime",
  middleware.verifyToken,
  TimeKeepingController.GetTimeKeepingsByUserIdAndShiftIdAndDateTime
);

// API
module.exports = router;
