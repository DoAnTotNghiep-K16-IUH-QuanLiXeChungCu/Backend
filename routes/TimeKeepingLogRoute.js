const { Router } = require("express");
const TimeKeepingLogController = require("../controllers/TimeKeepingLogController");
const middleware = require("../middleware/middlewareController");
const router = Router();

router.patch(
  "/GetAllTimeKeepingLog",
  middleware.verifyToken,
  TimeKeepingLogController.GetAllLogs
);
router.patch(
  "/GetTimeKeepingLogByID",
  middleware.verifyToken,
  TimeKeepingLogController.GetLogByID
);
router.patch(
  "/CreateTimeKeepingLog",
  middleware.verifyToken,
  TimeKeepingLogController.CreateLog
);
router.post(
  "/UpdateTimeKeepingLog",
  middleware.verifyToken,
  TimeKeepingLogController.UpdateLog
);
router.delete(
  "/DeleteTimeKeepingLog",
  middleware.verifyToken,
  TimeKeepingLogController.DeleteLog
);
router.patch(
  "/GetTimeKeepingLogFromDayToDay",
  middleware.verifyToken,
  TimeKeepingLogController.getLogsFromDayToDay
);
router.patch(
  "/GetTimeKeepingLogToday",
  middleware.verifyToken,
  TimeKeepingLogController.getLogsToDay
);
router.patch(
  "/GetTimeKeepingLogPerMonth",
  middleware.verifyToken,
  TimeKeepingLogController.getLogsPerMonth
);
router.put(
  "/GetTimeKeepingLogPerYear",
  middleware.verifyToken,
  TimeKeepingLogController.getLogsPerYear
);
// Đảm bảo bạn export router đúng cách
module.exports = router;
