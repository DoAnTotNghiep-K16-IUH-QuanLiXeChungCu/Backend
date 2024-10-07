const { Router } = require("express");
const ApartmentController = require("../controllers/ApartmentController");
const middleware = require("../middleware/middlewareController");
const router = Router();

// http://localhost:3000/api/v1/apartment/GetAllApartments
router.patch("/GetAllApartments", middleware.verifyToken , ApartmentController.GetAllApartments);

// http://localhost:3000/api/v1/apartment/GetApartmentById
router.patch("/GetApartmentById", middleware.verifyToken , ApartmentController.GetApartmentById);

// Đảm bảo bạn export router đúng cách
module.exports = router; 