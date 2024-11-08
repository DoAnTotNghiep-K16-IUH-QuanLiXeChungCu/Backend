const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");

let clientsEntry = [];
let clientsExit = [];
let lastRfidEntry = "";
let lastRfidExit = "";
let portEntry;
let portExit;

let anotherClientsEntry = [];
let anotherClientsExit = [];
let anotherPortEntry;
let anotherPortExit;
let anotherLastRfidEntry = "";
let anotherLastRfidExit = "";

// Khởi tạo cổng serial cho Entry và Exit
const initSerialPortEntry = (portPath, baudRate) => {
  if (portEntry && portEntry.isOpen) {
    portEntry.close((err) => {
      if (err) {
        console.error(`Lỗi khi đóng cổng Entry: ${err.message}`);
      } else {
        console.log("Cổng Entry đã được đóng trước khi khởi tạo lại.");
        openSerialPortEntry(portPath, baudRate); // Mở lại cổng Entry sau khi đóng
      }
    });
  } else {
    openSerialPortEntry(portPath, baudRate); // Mở cổng Entry nếu chưa được mở
  }
};

const initSerialPortExit = (portPath, baudRate) => {
  if (portExit && portExit.isOpen) {
    portExit.close((err) => {
      if (err) {
        console.error(`Lỗi khi đóng cổng Exit: ${err.message}`);
      } else {
        console.log("Cổng Exit đã được đóng trước khi khởi tạo lại.");
        openSerialPortExit(portPath, baudRate); // Mở lại cổng Exit sau khi đóng
      }
    });
  } else {
    openSerialPortExit(portPath, baudRate); // Mở cổng Exit nếu chưa được mở
  }
};

// Hàm mở cổng serial cho Entry
const openSerialPortEntry = (portPath, baudRate) => {
  portEntry = new SerialPort({ path: portPath, baudRate: baudRate }).on(
    "error",
    (err) => {
      console.error(`Lỗi mở cổng Entry ${portPath}: ${err.message}`);
    }
  );
  const parser = portEntry.pipe(new ReadlineParser({ delimiter: "\n" }));

  // Đọc dữ liệu từ cổng Entry
  parser.on("data", (data) => {
    console.log(`Dữ liệu từ Entry: ${data}`);
    lastRfidEntry = data.trim(); // Lưu thông tin thẻ RFID từ Entry

    // Gửi dữ liệu cho tất cả các client đang kết nối với Entry
    clientsEntry.forEach((res) => res.write(`data: ${lastRfidEntry}\n\n`));
  });
};

// Hàm mở cổng serial cho Exit
const openSerialPortExit = (portPath, baudRate) => {
  portExit = new SerialPort({ path: portPath, baudRate: baudRate }).on(
    "error",
    (err) => {
      console.error(`Lỗi mở cổng Exit ${portPath}: ${err.message}`);
    }
  );
  const parser = portExit.pipe(new ReadlineParser({ delimiter: "\n" }));

  // Đọc dữ liệu từ cổng Exit
  parser.on("data", (data) => {
    console.log(`Dữ liệu từ Exit: ${data}`);
    lastRfidExit = data.trim(); // Lưu thông tin thẻ RFID từ Exit

    // Gửi dữ liệu cho tất cả các client đang kết nối với Exit
    clientsExit.forEach((res) => res.write(`data: ${lastRfidExit}\n\n`));
  });
};

// Endpoint để khởi tạo cổng serial cho Entry
const setupSerialPortEntry = (req, res) => {
  const { comPort, baudRate } = req.body;
  if (!comPort) {
    return res
      .status(400)
      .send(
        `Cổng serial ${comPort} cho Entry không được cung cấp hoặc đã bị sử dụng`
      );
  }
  initSerialPortEntry(comPort, baudRate);
  res.status(200).send(`Cổng serial Entry ${comPort} đã được khởi tạo.`);
};

// Endpoint để khởi tạo cổng serial cho Exit
const setupSerialPortExit = (req, res) => {
  const { comPort, baudRate } = req.body;
  if (!comPort) {
    return res
      .status(400)
      .send(
        `Cổng serial ${comPort} cho Exit không được cung cấp hoặc đã bị sử dụng`
      );
  }
  initSerialPortExit(comPort, baudRate);
  res.status(200).send(`Cổng serial Exit ${comPort} đã được khởi tạo.`);
};

// Endpoint SSE để gửi dữ liệu RFID cho Entry
const getRFIDEventsEntry = (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();
  res.write(`data: ${lastRfidEntry}\n\n`);
  clientsEntry.push(res);
  req.on("close", () => {
    clientsEntry = clientsEntry.filter((client) => client !== res);
  });
};

// Endpoint SSE để gửi dữ liệu RFID cho Exit
const getRFIDEventsExit = (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();
  res.write(`data: ${lastRfidExit}\n\n`);
  clientsExit.push(res);
  req.on("close", () => {
    clientsExit = clientsExit.filter((client) => client !== res);
  });
};

// Khởi tạo cổng serial cho Entry và Exit
const initAnotherSerialPortEntry = (portPath, baudRate) => {
  if (anotherPortEntry && anotherPortEntry.isOpen) {
    anotherPortEntry.close((err) => {
      if (err) {
        console.error(`Lỗi khi đóng cổng Entry: ${err.message}`);
      } else {
        console.log("Cổng Entry đã được đóng trước khi khởi tạo lại.");
        openAnotherSerialPortEntry(portPath, baudRate); // Mở lại cổng Entry sau khi đóng
      }
    });
  } else {
    openAnotherSerialPortEntry(portPath, baudRate); // Mở cổng Entry nếu chưa được mở
  }
};

const initAnotherSerialPortExit = (portPath, baudRate) => {
  if (anotherPortExit && anotherPortExit.isOpen) {
    anotherPortExit.close((err) => {
      if (err) {
        console.error(`Lỗi khi đóng cổng Exit: ${err.message}`);
      } else {
        console.log("Cổng Exit đã được đóng trước khi khởi tạo lại.");
        openAnotherSerialPortExit(portPath, baudRate); // Mở lại cổng Exit sau khi đóng
      }
    });
  } else {
    openAnotherSerialPortExit(portPath, baudRate); // Mở cổng Exit nếu chưa được mở
  }
};

// Hàm mở cổng serial cho Entry
const openAnotherSerialPortEntry = (portPath, baudRate) => {
  anotherPortEntry = new SerialPort({ path: portPath, baudRate: baudRate }).on(
    "error",
    (err) => {
      console.error(`Lỗi mở cổng Entry ${portPath}: ${err.message}`);
    }
  );
  const parser = anotherPortEntry.pipe(new ReadlineParser({ delimiter: "\n" }));

  // Đọc dữ liệu từ cổng Entry
  parser.on("data", (data) => {
    console.log(`Dữ liệu từ Entry: ${data}`);
    anotherLastRfidEntry = data.trim(); // Lưu thông tin thẻ RFID từ Entry

    // Gửi dữ liệu cho tất cả các client đang kết nối với Entry
    anotherClientsEntry.forEach((res) =>
      res.write(`data: ${anotherLastRfidEntry}\n\n`)
    );
  });
};

// Hàm mở cổng serial cho Exit
const openAnotherSerialPortExit = (portPath, baudRate) => {
  anotherPortEntry = new SerialPort({ path: portPath, baudRate: baudRate }).on(
    "error",
    (err) => {
      console.error(`Lỗi mở cổng Exit ${portPath}: ${err.message}`);
    }
  );
  const parser = anotherPortEntry.pipe(new ReadlineParser({ delimiter: "\n" }));

  // Đọc dữ liệu từ cổng Exit
  parser.on("data", (data) => {
    console.log(`Dữ liệu từ Exit: ${data}`);
    anotherLastRfidExit = data.trim(); // Lưu thông tin thẻ RFID từ Exit

    // Gửi dữ liệu cho tất cả các client đang kết nối với Exit
    anotherClientsExit.forEach((res) =>
      res.write(`data: ${anotherLastRfidExit}\n\n`)
    );
  });
};

// Endpoint để khởi tạo cổng serial cho Entry
const setupAnotherSerialPortEntry = (req, res) => {
  const { comPort, baudRate } = req.body;
  if (!comPort) {
    return res
      .status(400)
      .send(
        `Cổng serial ${comPort} cho Entry không được cung cấp hoặc đã bị sử dụng`
      );
  }
  initAnotherSerialPortEntry(comPort, baudRate);
  res.status(200).send(`Cổng serial Entry ${comPort} đã được khởi tạo.`);
};

// Endpoint để khởi tạo cổng serial cho Exit
const setupAnotherSerialPortExit = (req, res) => {
  const { comPort, baudRate } = req.body;
  if (!comPort) {
    return res
      .status(400)
      .send(
        `Cổng serial ${comPort} cho Exit không được cung cấp hoặc đã bị sử dụng`
      );
  }
  initAnotherSerialPortExit(comPort, baudRate);
  res.status(200).send(`Cổng serial Exit ${comPort} đã được khởi tạo.`);
};

// Endpoint SSE để gửi dữ liệu RFID cho Entry
const getAnotherRFIDEventsEntry = (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();
  res.write(`data: ${anotherLastRfidEntry}\n\n`);
  anotherClientsEntry.push(res);
  req.on("close", () => {
    anotherClientsEntry = anotherClientsEntry.filter(
      (client) => client !== res
    );
  });
};

// Endpoint SSE để gửi dữ liệu RFID cho Exit
const getAnotherRFIDEventsExit = (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();
  res.write(`data: ${anotherLastRfidExit}\n\n`);
  anotherClientsExit.push(res);
  req.on("close", () => {
    anotherClientsExit = anotherClientsExit.filter((client) => client !== res);
  });
};

// Endpoint để lấy danh sách các cổng COM
const getListPorts = async (req, res) => {
  try {
    const ports = await SerialPort.list();
    res.json(ports);
  } catch (error) {
    res.status(500).json({ error: "Error listing ports" });
  }
};

module.exports = {
  getRFIDEventsEntry,
  getRFIDEventsExit,
  setupSerialPortEntry,
  setupSerialPortExit,
  getAnotherRFIDEventsEntry,
  getAnotherRFIDEventsExit,
  setupAnotherSerialPortEntry,
  setupAnotherSerialPortExit,
  getListPorts,
};
