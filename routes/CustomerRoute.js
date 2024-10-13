const { Router } = require("express");
const CustomerController = require("../controllers/CustomerController");
const middleware = require("../middleware/middlewareController");
const router = Router();

// http://localhost:3000/api/v1/customer/GetAllCustomers
router.patch("/GetAllCustomers", middleware.verifyToken , CustomerController.GetAllCustomers);

// http://localhost:3000/api/v1/customer/GetCustomerById
router.patch("/GetCustomerById", middleware.verifyToken , CustomerController.GetCustomerById);

// http://localhost:3000/api/v1/customer/CreateCustomer
router.post("/CreateCustomer", middleware.verifyToken , CustomerController.CreateCustomer);

// http://localhost:3000/api/v1/customer/UpdateCustomer
router.put("/UpdateCustomer", middleware.verifyToken , CustomerController.UpdateCustomer);

// http://localhost:3000/api/v1/customer/DeleteCustomer
router.delete("/DeleteCustomer", middleware.verifyToken , CustomerController.DeleteCustomer);

// http://localhost:3000/api/v1/customer/FilterCustomers
router.patch("/FilterCustomers", middleware.verifyToken , CustomerController.FilterCustomers);

// Đảm bảo bạn export router đúng cách
module.exports = router;