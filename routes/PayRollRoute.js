const { Router } = require("express");
const payRollcontroller = require("../controllers/PayRollcontroller");
const middleware = require("../middleware/middlewareController");
const router = Router();
router.patch(
  "/GetAllPayRolls",
  middleware.verifyToken,
  payRollcontroller.GetAllPayRolls
);
router.patch(
  "/GetPayRollByID",
  middleware.verifyToken,
  payRollcontroller.GetPayRollByID
);
router.post(
  "/UpdatePayRoll",
  middleware.verifyToken,
  payRollcontroller.UpdatePayRoll
);
router.put(
  "/CreatePayRoll",
  middleware.verifyToken,
  payRollcontroller.CreatePayRoll
);
router.delete(
  "/DeletePayRoll",
  middleware.verifyToken,
  payRollcontroller.DeletePayRoll
);
module.exports = router;
