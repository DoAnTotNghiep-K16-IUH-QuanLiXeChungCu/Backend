const { Router } = require("express");
const UserController = require("../controllers/UserController");
const router = Router();
// API //
// http://localhost:3000/api/v1/users/login
router.post("/login", UserController.login);

// http://localhost:3000/api/v1/users/sinup
router.post("/sinup", UserController.signup);

// http://localhost:3000/api/v1/users/GetAllUsers
router.patch("/GetAllUsers", UserController.GetAllUsers);

// http://localhost:3000/api/v1/users/UpdateUser
router.put("/UpdateUser", UserController.UpdateUser);

// API 
module.exports = router;
