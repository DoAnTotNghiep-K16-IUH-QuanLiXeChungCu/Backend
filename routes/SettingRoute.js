const { Router } = require("express");
const settingController = require("../controllers/SettingController");
const middleware = require("../middleware/middlewareController");
const router = Router();
router.patch(
  "/GetSettings",
  middleware.verifyToken,
  settingController.GetSettings
);
router.patch(
  "/GetSettingByID",
  middleware.verifyToken,
  settingController.GetSettingByID
);
router.post(
  "/UpdateSetting",
  middleware.verifyToken,
  settingController.UpdateSetting
);
module.exports = router;
