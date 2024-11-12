const { Router } = require("express");
const cameraController = require("../controllers/CameraController");
const middleware = require("../middleware/middlewareController");
const router = Router();
router.patch(
  "/GetAllCamera",
  middleware.verifyToken,
  cameraController.GetAllCamera
);
router.patch(
  "/GetCameraByID",
  middleware.verifyToken,
  cameraController.GetCameraByID
);
router.post(
  "/UpdateCamera",
  middleware.verifyToken,
  cameraController.UpdateCamera
);
router.put(
  "/CreateCamera",
  middleware.verifyToken,
  cameraController.CreateCamera
);
router.delete(
  "/DeleteCamera",
  middleware.verifyToken,
  cameraController.DeleteCamera
);
module.exports = router;
