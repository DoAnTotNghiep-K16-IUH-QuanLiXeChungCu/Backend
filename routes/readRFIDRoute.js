const { Router } = require("express");
const readRFIDController = require("../readRFID/server");
const middleware = require("../middleware/middlewareController");
const router = Router();
router.get("/ReadRFIDCardEnTry", readRFIDController.getRFIDEventsEntry);
router.get("/ReadRFIDCardExit", readRFIDController.getRFIDEventsExit);
router.post("/SetupSerialPortEntry", readRFIDController.setupSerialPortEntry);
router.post("/SetupSerialPortExit", readRFIDController.setupSerialPortExit);

router.get(
  "/ReadAnotherRFIDCardEnTry",
  readRFIDController.getAnotherRFIDEventsEntry
);
router.get(
  "/ReadAnotherRFIDCardExit",
  readRFIDController.getAnotherRFIDEventsExit
);
router.post(
  "/SetupAnotherSerialPortEntry",
  readRFIDController.setupAnotherSerialPortEntry
);
router.post(
  "/SetupAnotherSerialPortExit",
  readRFIDController.setupAnotherSerialPortExit
);
router.get("/ListPort", readRFIDController.getListPorts);

module.exports = router;
