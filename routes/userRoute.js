const { Router } = require("express");
const userController = require("../controllers/userController");
const router = Router();
// API //
// http://localhost:3000/api/v1/users/login
router.post("/login", userController.login);

// http://localhost:3000/api/v1/users/sinup
router.post("/sinup", userController.signup);


// API 
module.exports = router;
