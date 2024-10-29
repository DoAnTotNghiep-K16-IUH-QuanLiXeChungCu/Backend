const { Router } = require("express");
const UploadController = require("../uploadmedia/server");
const middleware = require("../middleware/middlewareController");
const router = Router();

// http://localhost:3000/api/v1/UploadMedia
// router.post("/UploadMedia", UploadController.upload.single('file'), UploadController.UploadFile);
router.post(
  "/UploadMedia",
  UploadController.upload.array("files"),
  UploadController.UploadFile
);

module.exports = router;
