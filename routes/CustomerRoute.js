const { Router } = require("express");
const CustomerController = require("../controllers/CustomerController");
const middleware = require("../middleware/middlewareController");
const router = Router();

// http://localhost:3000/api/v1/customer/GetAllCustomers
router.get("/GetAllCustomers", middleware.verifyToken , CustomerController.GetAllCustomers);

// http://localhost:3000/api/v1/customer/GetCustomerById
router.get("/GetCustomerById", middleware.verifyToken , CustomerController.GetCustomerById);

// Đảm bảo bạn export router đúng cách
module.exports = router;