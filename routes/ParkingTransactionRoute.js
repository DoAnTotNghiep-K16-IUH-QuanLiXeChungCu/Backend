const { Router } = require("express");
const ParkingTransactionController = require("../controllers/ParkingTransactionController");
const middleware = require("../middleware/middlewareController");
const router = Router();

router.patch(
  "/GetAllParkingTransaction",
  middleware.verifyToken,
  ParkingTransactionController.getAllParkingTransaction
);
router.patch(
  "/GetParkingTransactionByID",
  middleware.verifyToken,
  ParkingTransactionController.getParkingTransactionByID
);
router.post(
  "/CreateParkingTransaction",
  middleware.verifyToken,
  ParkingTransactionController.createParkingTransaction
);
router.post(
  "/UpdateParkingTransaction",
  middleware.verifyToken,
  ParkingTransactionController.updateParkingTransaction
);
router.delete(
  "/DeleteParkingTransaction",
  middleware.verifyToken,
  ParkingTransactionController.deleteParkingTransaction
);
router.patch(
  "/GetParkingTransactionFromDayToDay",
  middleware.verifyToken,
  ParkingTransactionController.getParkingTransactionFromDayToDay
);
router.patch(
  "/GetParkingTransactionToday",
  middleware.verifyToken,
  ParkingTransactionController.getParkingTransactionToday
);
router.patch(
  "/GetParkingTransactionPerMonth",
  middleware.verifyToken,
  ParkingTransactionController.getParkingTransactionPerMonth
);
router.put(
  "/GetParkingTransactionPerYear",
  middleware.verifyToken,
  ParkingTransactionController.getParkingTransactionPerYear
);
// Đảm bảo bạn export router đúng cách
module.exports = router;
