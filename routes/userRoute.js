const { Router } = require("express");
const UserController = require("../controllers/userController");
const router = Router();
const middleware = require("../middleware/middlewareController");

// API //
// http://localhost:3000/api/v1/users/login
router.post("/login", UserController.login);

// http://localhost:3000/api/v1/users/sinup
router.post("/sinup", UserController.signup);

// http://localhost:3000/api/v1/users/GetAllUsers
router.patch(
  "/GetAllUsers",
  middleware.verifyToken,
  UserController.GetAllUsers
);
router.patch(
  "/GetAllUsers",
  middleware.verifyToken,
  UserController.GetAllUsersNonDelete
);

// http://localhost:3000/api/v1/users/UpdateUser
router.put("/UpdateUser", middleware.verifyToken, UserController.UpdateUser);
router.delete(
  "/DeleteUsers",
  middleware.verifyToken,
  UserController.DeleteUsers
);
router.patch(
  "/GetUserByRFIDCard",
  middleware.verifyToken,
  UserController.GetUserByRFIDCard
);
router.post(
  "/CheckPassword",
  middleware.verifyToken,
  UserController.checkPassword
);

// API
module.exports = router;
