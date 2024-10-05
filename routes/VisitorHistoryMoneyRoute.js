const { Router } = require("express");
const VisitorHistoryMoneyController = require("../controllers/VisitorHistoryMoneyController");
const middleware = require("../middleware/middlewareController");
const router = Router();

// http://localhost:3000/api/v1/visitorHistoryMoney/GetAllVisitorHistoryMoney
router.get("/GetAllVisitorHistoryMoney", middleware.verifyToken , VisitorHistoryMoneyController.GetAllVisitorHistoryMoney);

// http://localhost:3000/api/v1/visitorHistoryMoney/CreateVisitorHistoryMoney
router.post("/CreateVisitorHistoryMoney", middleware.verifyToken , VisitorHistoryMoneyController.CreateVisitorHistoryMoney);

// http://localhost:3000/api/v1/visitorHistoryMoney/UpdateVisitorHistoryMoney
router.put("/UpdateVisitorHistoryMoney", middleware.verifyToken , VisitorHistoryMoneyController.UpdateVisitorHistoryMoney);

// http://localhost:3000/api/v1/visitorHistoryMoney/GetVisitorHistoryMoneyById
router.get("/GetVisitorHistoryMoneyById", middleware.verifyToken , VisitorHistoryMoneyController.GetVisitorHistoryMoneyById);

// http://localhost:3000/api/v1/visitorHistoryMoney/DeleteVisitorHistoryMoney
router.delete("/DeleteVisitorHistoryMoney", middleware.verifyToken , VisitorHistoryMoneyController.DeleteVisitorHistoryMoney);

// http://localhost:3000/api/v1/visitorHistoryMoney/GetMoneyByMonth
router.get("/GetMoneyByMonth", middleware.verifyToken , VisitorHistoryMoneyController.GetMoneyByMonth);

// http://localhost:3000/api/v1/visitorHistoryMoney/GetMoneyByDay
router.get("/GetMoneyByDay", middleware.verifyToken , VisitorHistoryMoneyController.GetMoneyByDay);

// http://localhost:3000/api/v1/visitorHistoryMoney/GetMoneyFromDayToDay
router.get("/GetMoneyFromDayToDay", middleware.verifyToken , VisitorHistoryMoneyController.GetMoneyFromDayToDay);

// Đảm bảo bạn export router đúng cách
module.exports = router;  