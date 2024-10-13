const { Router } = require("express");
const ResidentHistoryMoneyController = require("../controllers/ResidentHistoryMoneyController");
const middleware = require("../middleware/middlewareController");
const router = Router();

// http://localhost:3000/api/v1/residentHistoryMoney/GetAllResidentHistoryMoneys
router.patch("/GetAllResidentHistoryMoneys", middleware.verifyToken , ResidentHistoryMoneyController.GetAllResidentHistoryMoneys);

// http://localhost:3000/api/v1/residentHistoryMoney/CreateResidentHistoryMoney
router.post("/CreateResidentHistoryMoney", middleware.verifyToken , ResidentHistoryMoneyController.CreateResidentHistoryMoney);

// http://localhost:3000/api/v1/residentHistoryMoney/UpdateResidentHistoryMoney
router.put("/UpdateResidentHistoryMoney", middleware.verifyToken , ResidentHistoryMoneyController.UpdateResidentHistoryMoney);

// http://localhost:3000/api/v1/residentHistoryMoney/DeleteResidentHistoryMoney
router.delete("/DeleteResidentHistoryMoney", middleware.verifyToken , ResidentHistoryMoneyController.DeleteResidentHistoryMoney);

// http://localhost:3000/api/v1/residentHistoryMoney/GetResidentHistoryMoneyById
router.patch("/GetResidentHistoryMoneyById", middleware.verifyToken , ResidentHistoryMoneyController.GetResidentHistoryMoneyById);

// http://localhost:3000/api/v1/residentHistoryMoney/GetMonthlyStatistics
router.patch("/GetMonthlyStatistics", middleware.verifyToken , ResidentHistoryMoneyController.GetMonthlyStatistics);

// http://localhost:3000/api/v1/residentHistoryMoney/GetYearlyStatistics
router.patch("/GetYearlyStatistics", middleware.verifyToken , ResidentHistoryMoneyController.GetYearlyStatistics);

// http://localhost:3000/api/v1/residentHistoryMoney/FilterResidentHistoryMoneys
router.patch("/FilterResidentHistoryMoneys", middleware.verifyToken , ResidentHistoryMoneyController.FilterResidentHistoryMoneys);

// Đảm bảo bạn export router đúng cách
module.exports = router;