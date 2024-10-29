const { Router } = require("express");
const settingController = require("../controllers/SettingController");
const middleware = require("../middleware/middlewareController");
const router = Router();
router.patch("/GetSetting", settingController.GetSetting);
router.patch("/GetSettingByID", settingController.GetSettingByID);
router.post("/UpdateSetting", settingController.UpdateSetting);
module.exports = router;
