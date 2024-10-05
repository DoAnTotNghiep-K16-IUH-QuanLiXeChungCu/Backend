const { Router } = require("express");
const RFIDCardController = require("../controllers/RFIDCardController");
const middleware = require("../middleware/middlewareController");
const router = Router();

// http://localhost:3000/api/v1/RFIDCard/GetAllRFIDCards
router.get("/GetAllRFIDCards", middleware.verifyToken , RFIDCardController.GetAllRFIDCards);

// http://localhost:3000/api/v1/RFIDCard/GetRFIDCardById
router.get("/GetRFIDCardById", middleware.verifyToken , RFIDCardController.GetRFIDCardById);

// http://localhost:3000/api/v1/RFIDCard/CreateRFIDCard
router.post("/CreateRFIDCard", middleware.verifyToken , RFIDCardController.CreateRFIDCard);

// http://localhost:3000/api/v1/RFIDCard/UpdateRFIDCard
router.get("/UpdateRFIDCard", middleware.verifyToken , RFIDCardController.UpdateRFIDCard);

// http://localhost:3000/api/v1/RFIDCard/DeleteRFIDCard
router.delete("/DeleteRFIDCard", middleware.verifyToken , RFIDCardController.DeleteRFIDCard);

// http://localhost:3000/api/v1/RFIDCard/GetRFIDCardByUUID
router.get("/GetRFIDCardByUUID", middleware.verifyToken , RFIDCardController.GetRFIDCardByUUID);

// Api
module.exports = router;