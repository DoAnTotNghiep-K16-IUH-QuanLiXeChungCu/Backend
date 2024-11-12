const { Router } = require("express");
const laneController = require("../controllers/LaneController");
const middleware = require("../middleware/middlewareController");
const router = Router();
router.patch("/GetAllLane", middleware.verifyToken, laneController.GetAllLanes);
router.patch(
  "/GetLaneByID",
  middleware.verifyToken,
  laneController.GetLaneByID
);
router.post("/UpdateLane", middleware.verifyToken, laneController.UpdateLane);
router.put("/CreateLane", middleware.verifyToken, laneController.CreateLane);
router.delete("/DeleteLane", middleware.verifyToken, laneController.DeleteLane);
module.exports = router;
