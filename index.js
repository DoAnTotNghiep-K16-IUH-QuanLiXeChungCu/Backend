const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config();
const cors = require("cors");
const cookieParser = require("cookie-parser");
const app = express();
const http = require("http");
const server = http.createServer(app);
const ip = process.env.IP;
const port = process.env.PORT;
const mongodb = process.env.MONGODB_URI;

// routes
const UserRoute = require("./routes/UserRoute");
const EntryRecordRoute = require("./routes/EntryRecordRoute");
const ExitRecordRoute = require("./routes/ExitRecordRoute");
const CustomerRoute = require("./routes/CustomerRoute");
const VehicleRoute = require("./routes/VehicleRoute");
const ParkingSlotRoute = require("./routes/ParkingSlotRoute");
const ResidentHistoryMoneyRoute = require("./routes/ResidentHistoryMoneyRoute");  
const RFIDCardRoute = require("./routes/RFIDCardRoute");
const ShiftRoute = require("./routes/ShiftRoute");
const ParkingRateRoute = require("./routes/ParkingRateRoute");
const UserShiftRoute = require("./routes/UserShiftRoute");
const VisitorHistoryMoneyRoute = require("./routes/VisitorHistoryMoneyRoute");
const ApartmentRoute = require("./routes/ApartmentRoute");
const UploadRoute = require("./routes/UploadRoute");

// middleware
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(cors());
app.use(cookieParser());
// database connection
const dbURI = process.env.MONGODB_URI;
mongoose
  .connect(dbURI)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.error("Connection failed:", error);
  });
// routes
app.use("/api/v1/users", UserRoute);
app.use("/api/v1/entryRecord", EntryRecordRoute);
app.use("/api/v1/exitRecord", ExitRecordRoute);
app.use("/api/v1/customer", CustomerRoute);
app.use("/api/v1/vehicle", VehicleRoute);
app.use("/api/v1/parkingSlot", ParkingSlotRoute);
app.use("/api/v1/residentHistoryMoney", ResidentHistoryMoneyRoute);
app.use("/api/v1/parkingRate", ParkingRateRoute);
app.use("/api/v1/RFIDCard", RFIDCardRoute);
app.use("/api/v1/shift", ShiftRoute);
app.use("/api/v1/userShift", UserShiftRoute);
app.use("/api/v1/visitorHistoryMoney", VisitorHistoryMoneyRoute);
app.use("/api/v1/apartment", ApartmentRoute);
app.use("/api/v1/upload", UploadRoute); 

app.use(function (req, res) {
  res.status(404).send("Not found");
});

// Bắt đầu server và lắng nghe các kết nối tới
server.listen(port, ip, () => {
  console.log("Server is running on IP: " + ip);
  console.log("Server is running on PORT: " + port);
  console.log("Server is running on DB: " + mongodb);
});