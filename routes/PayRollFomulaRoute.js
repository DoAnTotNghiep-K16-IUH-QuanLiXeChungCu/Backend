const { Router } = require("express");
const payRollFomulaController = require("../controllers/PayRollFomulaController");
const middleware = require("../middleware/middlewareController");
const router = Router();
router.patch(
  "/GetAllPayRollFomulas",
  middleware.verifyToken,
  payRollFomulaController.GetAllPayRollFomula
);
router.patch(
  "/GetPayRollFomulaByID",
  middleware.verifyToken,
  payRollFomulaController.GetPayRollFomulaByID
);
router.post(
  "/UpdatePayRollFomula",
  middleware.verifyToken,
  payRollFomulaController.UpdatePayRollFomula
);
router.put(
  "/CreatePayRollFomula",
  middleware.verifyToken,
  payRollFomulaController.CreatePayRollFomula
);
router.delete(
  "/DeletePayRollFomula",
  middleware.verifyToken,
  payRollFomulaController.DeletePayRollFomula
);
module.exports = router;
