
use("QLXCC");
// Tạo bảng apartments
db.createCollection("apartments");
// Tạo bảng parking_rates
db.createCollection("parking_rates");
// Tạo bảng visitor_history_moneys
db.createCollection("visitor_history_moneys");
// Tạo bảng parking_slots
db.createCollection("parking_slots");
// Tạo bảng resident_history_moneys
db.createCollection("resident_history_moneys");
// Tạo bảng entry_records
db.createCollection("entry_records");
// Tạo bảng exit_records
db.createCollection("exit_records");
// Tạo bảng vehicles
db.createCollection("vehicles");
// Tạo bảng customers
db.createCollection("customers");
// Tạo bảng users
db.createCollection("users");
// Tạo bảng users_shift
db.createCollection("users_shift");
// Tạo bảng shift
db.createCollection("shift");

db.users.insertMany([
  {
    _id: ObjectId("69aae4843ae33121e0de8501"),
    role: "Admin",
    username: "TuanKiet",
    password: "Kiet271002@",
    age: 22,
    address: "Binh Thuan",
    phoneNumber: "0123456788",
  },
  {
    _id: ObjectId("69aae4843ae33121e0de8502"),
    role: "Admin",
    username: "ThienDat",
    password: "ThienDat@",
    age: 22,
    address: "Dong Nai",
    phoneNumber: "0123456789",
  }
]);

db.shift.insertMany([
  {
    _id: ObjectId("69aae9843ae33121e0de8501"),
    shiftName: "Sang",
    startTime: "05:00",
    endTime: "12:00",
  },
  {
    _id: ObjectId("69aae9843ae33121e0de8502"),
    shiftName: "Chieu",
    startTime: "12:00",
    endTime: "17:00",
  },
  {
    _id: ObjectId("69aae9843ae33121e0de8503"),
    shiftName: "Toi",
    startTime: "17:00",
    endTime: "22:00",
  },
  {
    _id: ObjectId("69aae9843ae33121e0de8504"),
    shiftName: "Dem",
    startTime: "22:00",
    endTime: "05:00",
  },
]);

db.users_shift.insertMany([
  {
    _id: ObjectId("69aae9843ae33121e0de8541"),
    userId: ObjectId("69aae4843ae33121e0de8502"),
    shiftId: ObjectId("69aae9843ae33121e0de8501"),
    dateTime:   ISODate("2024-01-01"),
  },
  {
    _id: ObjectId("69aae9843ae33121e0de8532"),
    userId: ObjectId("69aae4843ae33121e0de8501"),
    shiftId : ObjectId("69aae9843ae33121e0de8502"),
    dateTime:   ISODate("2024-01-01"),
  },
  {
    _id: ObjectId("69aae9843ae33121e0de8523"),
    userId: ObjectId("69aae4843ae33121e0de8501"),
    shiftId: ObjectId("69aae9843ae33121e0de8503"),
    dateTime:   ISODate("2024-01-01"),
  },
  {
    _id: ObjectId("69aae9843ae33121e0de8514"),
    userId: ObjectId("69aae4843ae33121e0de8502"),
    shiftId: ObjectId("69aae9843ae33121e0de8504"),
    dateTime:   ISODate("2024-01-01"),
  }
]);

db.apartments.insertMany([
  {
    _id: ObjectId("60aae4843ae33121e0de8501"),
    name: "A101",
  },
  {
    _id: ObjectId("60aae4843ae33121e0de8502"),
    name: "A102",
  },
  {
    _id: ObjectId("60aae4843ae33121e0de8503"),
    name: "A103",
  },
  {
    _id: ObjectId("60aae4843ae33121e0de8504"),
    name: "A104",
  },
  {
    _id: ObjectId("60aae4843ae33121e0de8505"),
    name: "A105",
  },
  {
    _id: ObjectId("60aae4843ae33121e0de8506"),
    name: "A106",
  },
  {
    _id: ObjectId("60aae4843ae33121e0de8507"),
    name: "A107",
  },
  {
    _id: ObjectId("60aae4843ae33121e0de8508"),
    name: "A108",
  },
  {
    _id: ObjectId("60aae4843ae33121e0de8509"),
    name: "A109",
  },
  {
    _id: ObjectId("60aae4843ae33121e0de8510"),
    name: "A110",
  },
]);

db.parking_slots.insertMany([
  {
    _id: ObjectId("61aae4843a444431e0de8501"),
    slotCode: "A",
    slotType: "car",
    availableSlots: 19,
    totalQuantity: 20,
  },
  {
    _id: ObjectId("61aae4843a444431e0de8502"),
    slotCode: "B",
    slotType: "car",
    availableSlots: 19,
    totalQuantity: 20,
  },
  {
    _id: ObjectId("61aae4843a444431e0de8503"),
    slotCode: "C",
    slotType: "car",
    availableSlots: 18,
    totalQuantity: 20,
  },
  {
    _id: ObjectId("61aae4843a444431e0de8504"),
    slotCode: "D",
    slotType: "car",
    availableSlots: 16,
    totalQuantity: 20,
  },
  {
    _id: ObjectId("61aae4843a444431e0de8505"),
    slotCode: "A",
    slotType : "motor",
    availableSlots: 49,
    totalQuantity: 50,
  },
  {
    _id: ObjectId("61aae4843a444431e0de8506"),
    slotCode: "B",
    slotType : "motor",
    availableSlots: 49,
    totalQuantity: 50,
  },
  {
    _id: ObjectId("61aae4843a444431e0de8507"),
    slotCode: "C",
    slotType : "motor",
    availableSlots: 48,
    totalQuantity: 50,
  },
  {
    _id: ObjectId("61aae4843a444431e0de8508"),
    slotCode: "D",
    slotType : "motor",
    availableSlots: 50,
    totalQuantity: 50,
  }
]);

db.parking_rates.insertMany([
  {
    _id: ObjectId("62aae4843a245431e0de8501"),
    vehicleType: "motor",
    hourly: 6,
    price: 5000,
  },
  {
    _id: ObjectId("62aae4843a245431e0de8502"),
    vehicleType: "motor",
    hourly: 12,
    price: 7000,
  },
  {
    _id: ObjectId("62aae4843a245431e0de8503"),
    vehicleType: "motor",
    hourly: 24,
    price: 10000,
  },
  {
    _id: ObjectId("62aae4843a245431e0de8504"),
    vehicleType: "car",
    hourly: 6,
    price: 50000,
  },
  {
    _id: ObjectId("62aae4843a245431e0de8505"),
    vehicleType: "car",
    hourly: 12,
    price: 80000,
  },
  {
    _id: ObjectId("62aae4843a245431e0de8506"),
    vehicleType: "car",
    hourly: 24,
    price: 140000,
  }
]);

db.customers.insertMany([
  {
    _id: ObjectId("63aae48436542431e0de8501"),
    apartmentsId: ObjectId("60aae4843ae33121e0de8501"),
    fullName: "Nguyễn Văn A",
    phoneNumber: "0123456589",
    isDelete: false,
  },
  {
    _id: ObjectId("63aae48436542431e0de8502"),
    apartmentsId: ObjectId("60aae4843ae33121e0de8501"),
    fullName: "Nguyễn Văn B",
    phoneNumber: "0193456789",
    isDelete: false,
  },
  {
    _id: ObjectId("63aae48436542431e0de8503"),
    apartmentsId: ObjectId("60aae4843ae33121e0de8502"),
    fullName: "Nguyễn Văn C",
    phoneNumber: "0123356789",
    isDelete: false,
  },
  {
    _id: ObjectId("63aae48436542431e0de8504"),
    apartmentsId: ObjectId("60aae4843ae33121e0de8502"),
    fullName: "Nguyễn Văn D",
    phoneNumber: "0123456729",
    isDelete: false,
  },
  {
    _id: ObjectId("63aae48436542431e0de8505"),
    apartmentsId: ObjectId("60aae4843ae33121e0de8503"),
    fullName: "Nguyễn Văn E",
    phoneNumber: "0123496789",
    isDelete: false,
  },
  {
    _id: ObjectId("63aae48436542431e0de8506"),
    apartmentsId: ObjectId("60aae4843ae33121e0de8503"),
    fullName: "Nguyễn Văn F",
    phoneNumber: "0143456789",
    isDelete: false,
  },
  {
    _id: ObjectId("63aae48436542431e0de8507"),
    apartmentsId: ObjectId("60aae4843ae33121e0de8504"),
    fullName: "Nguyễn Văn G",
    phoneNumber: "0123256789",
    isDelete: false,
  },
  {
    _id: ObjectId("63aae48436542431e0de8508"),
    apartmentsId: ObjectId("60aae4843ae33121e0de8504"),
    fullName: "Nguyễn Văn H",
    phoneNumber: "0127456789",
    isDelete: false,
  },
  {
    _id: ObjectId("63aae48436542431e0de8509"),
    apartmentsId: ObjectId("60aae4843ae33121e0de8505"),
    fullName: "Nguyễn Văn I",
    phoneNumber: "0123496789",
    isDelete: false,
  },
  {
    _id: ObjectId("63aae48436542431e0de8510"),
    apartmentsId: ObjectId("60aae4843ae33121e0de8505"),
    fullName: "Nguyễn Văn A",
    phoneNumber: "0123456789",
    isDelete: false,
  }
]);

db.vehicles.insertMany([
  {
    _id: ObjectId("64aae48436542431e0de8501"),
    customerId: ObjectId("63aae48436542431e0de8501"),
    licensePlate: "51A-12345",
    type: "car",
    color : "red",
    brand: "Toyota",
    isDelete: false,
  },
  {
    _id: ObjectId("64aae48436542431e0de8502"),
    customerId: ObjectId("63aae48436542431e0de8502"),
    licensePlate: "51A-12346",
    type: "motor",
    color : "white",
    brand: "Honda",
    isDelete: false,
  },
  {
    _id: ObjectId("64aae48436542431e0de8503"),
    customerId: ObjectId("63aae48436542431e0de8503"),
    licensePlate: "51A-12347",
    type: "car",
    color : "black",
    brand: "Toyota",
    isDelete: false,
  },
  {
    _id: ObjectId("64aae48436542431e0de8504"),
    customerId: ObjectId("63aae48436542431e0de8504"),
    licensePlate: "51A-12348",
    type: "motor",
    color : "red",
    brand: "Yamaha",
    isDelete: false,
  },
  {
    _id: ObjectId("64aae48436542431e0de8505"),
    customerId: ObjectId("63aae48436542431e0de8505"),
    licensePlate: "51A-12349",
    type: "car",
    color : "red",
    brand: "Kia",
    isDelete: false,
  },
  {
    _id: ObjectId("64aae48436542431e0de8506"),
    customerId: ObjectId("63aae48436542431e0de8506"),
    licensePlate: "51A-12310",
    type: "car",
    color : "red",
    brand: "Toyota",
    isDelete: false,
  },
  {
    _id: ObjectId("64aae48436542431e0de8507"),
    customerId: ObjectId("63aae48436542431e0de8507"),
    licensePlate: "51A-12311",
    type: "car",
    color : "red",
    brand: "Kia",
    isDelete: false,
  },
  {
    _id: ObjectId("64aae48436542431e0de8508"),
    customerId: ObjectId("63aae48436542431e0de8508"),
    licensePlate: "51A-12312",
    type: "motor",
    color : "red",
    brand: "Yamaha",
    isDelete: false,
  },
  {
    _id: ObjectId("64aae48436542431e0de8509"),
    customerId: ObjectId("63aae48436542431e0de8509"),
    licensePlate: "51A-12313",
    type: "car",
    color : "red",
    brand: "Toyota",
    isDelete: false,
  },
  {
    _id: ObjectId("64aae48436542431e0de8510"),
    customerId: ObjectId("63aae48436542431e0de8510"),
    licensePlate: "51A-12314",
    type: "motor",
    color : "white",
    brand: "honda",
    isDelete: false,
  }
]);

db.resident_history_moneys.insertMany([
  {
    _id: ObjectId("65aae48436542431e0de8501"),
    vehicleId: ObjectId("64aae48436542431e0de8501"),//car
    parking_slotId: ObjectId("61aae4843a444431e0de8501"),
    monthlyFee: 500000,
    startDate: ISODate("2024-01-01"),
    endDate: ISODate("2024-02-01"),
    isDelete: false,
  },
  {
    _id: ObjectId("65aae48436542431e0de8502"),
    vehicleId: ObjectId("64aae48436542431e0de8502"),
    parking_slotId: ObjectId("61aae4843a444431e0de8505"), //motor
    monthlyFee: 150000,
    startDate: ISODate("2024-02-01"),
    endDate: ISODate("2024-03-01"),
    isDelete: false,
  },
  {
    _id: ObjectId("65aae48436542431e0de8503"),
    vehicleId: ObjectId("64aae48436542431e0de8503"),
    parking_slotId: ObjectId("61aae4843a444431e0de8503"), //car
    monthlyFee: 500000,
    startDate: ISODate("2024-01-01"),
    endDate: ISODate("2024-02-01"),
    isDelete: false,
  },
  {
    _id: ObjectId("65aae48436542431e0de8504"),
    vehicleId: ObjectId("64aae48436542431e0de8504"),
    parking_slotId: ObjectId("61aae4843a444431e0de8506"),   //motor
    monthlyFee: 150000,
    startDate: ISODate("2024-01-01"),
    endDate: ISODate("2024-02-01"),
    isDelete: false,
  },
  {
    _id: ObjectId("65aae48436542431e0de8505"),
    vehicleId: ObjectId("64aae48436542431e0de8505"),
    parking_slotId: ObjectId("61aae4843a444431e0de8504"), //car
    monthlyFee: 500000,
    startDate: ISODate("2024-02-01"),
    endDate: ISODate("2024-03-01"),
    isDelete: false,
  },
  {
    _id: ObjectId("65aae48436542431e0de8506"),
    vehicleId: ObjectId("64aae48436542431e0de8506"),
    parking_slotId: ObjectId("61aae4843a444431e0de8504"),   //car 
    monthlyFee: 500000,
    startDate: ISODate("2024-02-01"),
    endDate: ISODate("2024-03-01"),
    isDelete: false,
  },
  {
    _id: ObjectId("65aae48436542431e0de8507"),
    vehicleId: ObjectId("64aae48436542431e0de8507"),
    parking_slotId: ObjectId("61aae4843a444431e0de8504"), //car
    monthlyFee: 500000,
    startDate: ISODate("2024-01-01"),
    endDate: ISODate("2024-02-01"),
    isDelete: false,
  },
  {
    _id: ObjectId("65aae48436542431e0de8508"),
    vehicleId: ObjectId("64aae48436542431e0de8508"),
    parking_slotId: ObjectId("61aae4843a444431e0de8507"), //motor
    monthlyFee: 150000,
    startDate: ISODate("2024-02-01"),
    endDate: ISODate("2024-03-01"),
    isDelete: false,
  },
  {
    _id: ObjectId("65aae48436542431e0de8509"),
    vehicleId: ObjectId("64aae48436542431e0de8509"),
    parking_slotId: ObjectId("61aae4843a444431e0de8504"), //car
    monthlyFee: 500000,
    startDate: ISODate("2024-01-01"),
    endDate: ISODate("2024-02-01"),
    isDelete: false,
  },
  {
    _id: ObjectId("65aae48436542431e0de8510"),
    vehicleId: ObjectId("64aae48436542431e0de8510"),
    parking_slotId: ObjectId("61aae4843a444431e0de8507"), //motor
    monthlyFee: 150000,
    startDate: ISODate("2024-02-01"),
    endDate: ISODate("2024-03-01"),
    isDelete: false,
  }
]);

db.entry_records.insertMany([
  {
    _id: ObjectId("66aae42226542431e0de8501"),
    entryTime: ISODate("2024-01-01T08:00:00.000Z"),
    picture_front: "https://images2.thanhnien.vn/528068263637045248/2024/1/25/428059e47aeafb68640f168d615371dc-65a11b038315c880-1706156293087602824781.jpg",
    picture_back: "https://images2.thanhnien.vn/528068263637045248/2024/1/25/428059e47aeafb68640f168d615371dc-65a11b038315c880-1706156293087602824781.jpg",
    licensePlate: "51A-12345",
    isResident: true,
    vehicleType: "car",
    isOut: true,
    users_shiftId: ObjectId("69aae9843ae33121e0de8541"),
    isDelete: false,
  },
  {
    _id: ObjectId("66aae42226542431e0de8502"),
    entryTime: ISODate("2024-01-01T09:00:00.000Z"),
    picture_front: "https://images2.thanhnien.vn/528068263637045248/2024/1/25/428059e47aeafb68640f168d615371dc-65a11b038315c880-1706156293087602824781.jpg",
    picture_back: "https://images2.thanhnien.vn/528068263637045248/2024/1/25/428059e47aeafb68640f168d615371dc-65a11b038315c880-1706156293087602824781.jpg",
    licensePlate: "51A-12346",
    isResident: true,
    vehicleType: "motor",
    isOut: true,
    users_shiftId: ObjectId("69aae9843ae33121e0de8532"),
    isDelete: false,
  },
  {
    _id: ObjectId("66aae42226542431e0de8503"),
    entryTime: ISODate("2024-01-01T10:00:00.000Z"),
    picture_front: "https://images2.thanhnien.vn/528068263637045248/2024/1/25/428059e47aeafb68640f168d615371dc-65a11b038315c880-1706156293087602824781.jpg",
    picture_back: "https://images2.thanhnien.vn/528068263637045248/2024/1/25/428059e47aeafb68640f168d615371dc-65a11b038315c880-1706156293087602824781.jpg",
    licensePlate: "51A-12347",
    isResident: false,
    vehicleType: "car",
    isOut: true,
    users_shiftId: ObjectId("69aae9843ae33121e0de8523"),
    isDelete: false,
  },
  {
    _id: ObjectId("66aae42226542431e0de8504"),
    entryTime: ISODate("2024-01-01T11:00:00.000Z"),
    picture_front: "https://images2.thanhnien.vn/528068263637045248/2024/1/25/428059e47aeafb68640f168d615371dc-65a11b038315c880-1706156293087602824781.jpg",
    picture_back: "https://images2.thanhnien.vn/528068263637045248/2024/1/25/428059e47aeafb68640f168d615371dc-65a11b038315c880-1706156293087602824781.jpg",
    licensePlate: "51A-12348",
    isResident: false,
    vehicleType: "motor",
    isOut: true,
    users_shiftId: ObjectId("69aae9843ae33121e0de8514"),
    isDelete: false,
  },
  {
    _id: ObjectId("66aae42226542431e0de8505"),
    entryTime: ISODate("2024-01-01T12:00:00.000Z"),
    picture_front: "https://images2.thanhnien.vn/528068263637045248/2024/1/25/428059e47aeafb68640f168d615371dc-65a11b038315c880-1706156293087602824781.jpg",
    picture_back: "https://images2.thanhnien.vn/528068263637045248/2024/1/25/428059e47aeafb68640f168d615371dc-65a11b038315c880-1706156293087602824781.jpg",
    licensePlate: "51A-12349",
    isResident: true,
    vehicleType: "car",
    isOut: true,
    users_shiftId: ObjectId("69aae9843ae33121e0de8541"),
    isDelete: false,
  },
  {
    _id: ObjectId("66aae42226542431e0de8506"),
    entryTime: ISODate("2024-01-01T13:00:00.000Z"),
    picture_front: "https://images2.thanhnien.vn/528068263637045248/2024/1/25/428059e47aeafb68640f168d615371dc-65a11b038315c880-1706156293087602824781.jpg",
    picture_back: "https://images2.thanhnien.vn/528068263637045248/2024/1/25/428059e47aeafb68640f168d615371dc-65a11b038315c880-1706156293087602824781.jpg",
    licensePlate: "51A-12310",
    isResident: true,
    vehicleType: "car",
    isOut: true,
    users_shiftId: ObjectId("69aae9843ae33121e0de8532"),
    isDelete: false,
  },
  {
    _id: ObjectId("66aae42226542431e0de8507"),
    entryTime: ISODate("2024-01-01T14:00:00.000Z"),
    picture_front: "https://images2.thanhnien.vn/528068263637045248/2024/1/25/428059e47aeafb68640f168d615371dc-65a11b038315c880-1706156293087602824781.jpg",
    picture_back: "https://images2.thanhnien.vn/528068263637045248/2024/1/25/428059e47aeafb68640f168d615371dc-65a11b038315c880-1706156293087602824781.jpg",
    licensePlate: "51A-12311",
    isResident: false,
    vehicleType: "car",
    isOut: true,
    users_shiftId: ObjectId("69aae9843ae33121e0de8523"),
    isDelete: false,
  },
  {
    _id: ObjectId("66aae42226542431e0de8508"),
    entryTime: ISODate("2024-01-01T15:00:00.000Z"),
    picture_front: "https://images2.thanhnien.vn/528068263637045248/2024/1/25/428059e47aeafb68640f168d615371dc-65a11b038315c880-1706156293087602824781.jpg",
    picture_back: "https://images2.thanhnien.vn/528068263637045248/2024/1/25/428059e47aeafb68640f168d615371dc-65a11b038315c880-1706156293087602824781.jpg",
    licensePlate: "51A-12312",
    isResident: false,
    vehicleType: "motor",
    isOut: true,
    users_shiftId: ObjectId("69aae9843ae33121e0de8514"),
    isDelete: false,
  },
  {
    _id: ObjectId("66aae42226542431e0de8509"),
    entryTime: ISODate("2024-01-01T16:00:00.000Z"),
    picture_front: "https://images2.thanhnien.vn/528068263637045248/2024/1/25/428059e47aeafb68640f168d615371dc-65a11b038315c880-1706156293087602824781.jpg",
    picture_back: "https://images2.thanhnien.vn/528068263637045248/2024/1/25/428059e47aeafb68640f168d615371dc-65a11b038315c880-1706156293087602824781.jpg",
    licensePlate: "51A-12313",
    isResident: true,
    vehicleType: "car",
    isOut: true,
    users_shiftId: ObjectId("69aae9843ae33121e0de8541"),
    isDelete: false,
  },
  {
    _id: ObjectId("66aae42226542431e0de8510"),
    entryTime: ISODate("2024-01-01T17:00:00.000Z"),
    picture_front: "https://images2.thanhnien.vn/528068263637045248/2024/1/25/428059e47aeafb68640f168d615371dc-65a11b038315c880-1706156293087602824781.jpg",
    picture_back: "https://images2.thanhnien.vn/528068263637045248/2024/1/25/428059e47aeafb68640f168d615371dc-65a11b038315c880-1706156293087602824781.jpg",
    licensePlate: "51A-12314",
    isResident: true,
    vehicleType: "motor",
    isOut: true,
    users_shiftId: ObjectId("69aae9843ae33121e0de8532"),
    isDelete: false,
  }
]);

db.exit_records.insertMany([
  {
    _id: ObjectId("67aae42226542431e0de8501"),
    entry_recordId: ObjectId("66aae42226542431e0de8501"),
    exitTime: ISODate("2024-01-01T09:00:00.000Z"),
    picture_front: "https://images2.thanhnien.vn/528068263637045248/2024/1/25/428059e47aeafb68640f168d615371dc-65a11b038315c880-1706156293087602824781.jpg",
    picture_back: "https://images2.thanhnien.vn/528068263637045248/2024/1/25/428059e47aeafb68640f168d615371dc-65a11b038315c880-1706156293087602824781.jpg",
    licensePlate: "51A-12345",
    isResident: true,
    vehicleType: "car",
    isDelete: false,
  },
  {
    _id: ObjectId("67aae42226542431e0de8502"),
    entry_recordId: ObjectId("66aae42226542431e0de8502"),
    exitTime: ISODate("2024-01-01T10:00:00.000Z"),
    picture_front: "https://images2.thanhnien.vn/528068263637045248/2024/1/25/428059e47aeafb68640f168d615371dc-65a11b038315c880-1706156293087602824781.jpg",
    picture_back: "https://images2.thanhnien.vn/528068263637045248/2024/1/25/428059e47aeafb68640f168d615371dc-65a11b038315c880-1706156293087602824781.jpg",
    licensePlate: "51A-12346",
    isResident: true,
    vehicleType: "motor",
    isDelete: false,
  },
  {
    _id: ObjectId("67aae42226542431e0de8503"),
    entry_recordId: ObjectId("66aae42226542431e0de8503"),
    exitTime: ISODate("2024-01-01T11:00:00.000Z"),
    picture_front: "https://images2.thanhnien.vn/528068263637045248/2024/1/25/428059e47aeafb68640f168d615371dc-65a11b038315c880-1706156293087602824781.jpg",
    picture_back: "https://images2.thanhnien.vn/528068263637045248/2024/1/25/428059e47aeafb68640f168d615371dc-65a11b038315c880-1706156293087602824781.jpg",
    licensePlate: "51A-12347",
    isResident: false,
    vehicleType: "car",
    isDelete: false,
  },
  {
    _id: ObjectId("67aae42226542431e0de8504"),
    entry_recordId: ObjectId("66aae42226542431e0de8504"),
    exitTime: ISODate("2024-01-01T12:00:00.000Z"),
    picture_front: "https://images2.thanhnien.vn/528068263637045248/2024/1/25/428059e47aeafb68640f168d615371dc-65a11b038315c880-1706156293087602824781.jpg",
    picture_back: "https://images2.thanhnien.vn/528068263637045248/2024/1/25/428059e47aeafb68640f168d615371dc-65a11b038315c880-1706156293087602824781.jpg",
    licensePlate: "51A-12348",
    isResident: false,
    vehicleType: "motor",
    isDelete: false,
  },
  {
    _id: ObjectId("67aae42226542431e0de8505"),
    entry_recordId: ObjectId("66aae42226542431e0de8505"),
    exitTime: ISODate("2024-01-01T13:00:00.000Z"),
    picture_front: "https://images2.thanhnien.vn/528068263637045248/2024/1/25/428059e47aeafb68640f168d615371dc-65a11b038315c880-1706156293087602824781.jpg",
    picture_back: "https://images2.thanhnien.vn/528068263637045248/2024/1/25/428059e47aeafb68640f168d615371dc-65a11b038315c880-1706156293087602824781.jpg",
    licensePlate: "51A-12349",
    isResident: true,
    vehicleType: "car",
    isDelete: false,
  },
  {
    _id: ObjectId("67aae42226542431e0de8506"),
    entry_recordId: ObjectId("66aae42226542431e0de8506"),
    exitTime: ISODate("2024-01-01T14:00:00.000Z"),
    picture_front: "https://images2.thanhnien.vn/528068263637045248/2024/1/25/428059e47aeafb68640f168d615371dc-65a11b038315c880-1706156293087602824781.jpg",
    picture_back: "https://images2.thanhnien.vn/528068263637045248/2024/1/25/428059e47aeafb68640f168d615371dc-65a11b038315c880-1706156293087602824781.jpg",
    licensePlate: "51A-12310",
    isResident: true,
    vehicleType: "car",
    isDelete: false,
  },
  {
    _id: ObjectId("67aae42226542431e0de8507"),
    entry_recordId: ObjectId("66aae42226542431e0de8507"),
    exitTime: ISODate("2024-01-01T15:00:00.000Z"),
    picture_front: "https://images2.thanhnien.vn/528068263637045248/2024/1/25/428059e47aeafb68640f168d615371dc-65a11b038315c880-1706156293087602824781.jpg",
    picture_back: "https://images2.thanhnien.vn/528068263637045248/2024/1/25/428059e47aeafb68640f168d615371dc-65a11b038315c880-1706156293087602824781.jpg",
    licensePlate: "51A-12311",
    isResident: false,
    vehicleType: "car",
    isDelete: false,
  },
  {
    _id: ObjectId("67aae42226542431e0de8508"),
    entry_recordId: ObjectId("66aae42226542431e0de8508"),
    exitTime: ISODate("2024-01-01T16:00:00.000Z"),
    picture_front: "https://images2.thanhnien.vn/528068263637045248/2024/1/25/428059e47aeafb68640f168d615371dc-65a11b038315c880-1706156293087602824781.jpg",
    picture_back: "https://images2.thanhnien.vn/528068263637045248/2024/1/25/428059e47aeafb68640f168d615371dc-65a11b038315c880-1706156293087602824781.jpg",
    licensePlate: "51A-12312",
    isResident: false,
    vehicleType: "motor",
    isDelete: false,
  },
  {
    _id: ObjectId("67aae42226542431e0de8509"),
    entry_recordId: ObjectId("66aae42226542431e0de8509"),
    exitTime: ISODate("2024-01-01T17:00:00.000Z"),
    picture_front: "https://images2.thanhnien.vn/528068263637045248/2024/1/25/428059e47aeafb68640f168d615371dc-65a11b038315c880-1706156293087602824781.jpg",
    picture_back: "https://images2.thanhnien.vn/528068263637045248/2024/1/25/428059e47aeafb68640f168d615371dc-65a11b038315c880-1706156293087602824781.jpg",
    licensePlate: "51A-12313",
    isResident: true,
    vehicleType: "car",
    isDelete: false,
  },
  {
    _id: ObjectId("67aae42226542431e0de8510"),
    entry_recordId: ObjectId("66aae42226542431e0de8510"),
    exitTime: ISODate("2024-01-01T18:00:00.000Z"),
    picture_front: "https://images2.thanhnien.vn/528068263637045248/2024/1/25/428059e47aeafb68640f168d615371dc-65a11b038315c880-1706156293087602824781.jpg",
    picture_back: "https://images2.thanhnien.vn/528068263637045248/2024/1/25/428059e47aeafb68640f168d615371dc-65a11b038315c880-1706156293087602824781.jpg",
    licensePlate: "51A-12314",
    isResident: true,
    vehicleType: "motor",
    isDelete: false,
  }
]);

db.visitor_history_moneys.insertMany([
  {
    _id: ObjectId("68aae42226542431e0de8501"),
    exit_recordId: ObjectId("67aae42226542431e0de8501"),
    licensePlate: "52A-12314",
    dateTime: ISODate("2024-01-01T08:00:00.000Z"),
    hourly: 6,
    vehicleType: "car",
    parkingFee: 50000,
    isDelete: false,
  },
  {
    _id: ObjectId("68aae42226542431e0de8502"),
    exit_recordId: ObjectId("67aae42226542431e0de8502"),
    licensePlate: "52A-12315",
    dateTime: ISODate("2024-01-01T09:00:00.000Z"),
    hourly: 12,
    vehicleType: "motor",
    parkingFee: 7000,
    isDelete: false,
  },
  {
    _id: ObjectId("68aae42226542431e0de8503"),
    exit_recordId: ObjectId("67aae42226542431e0de8503"),
    licensePlate: "52A-12316",
    dateTime: ISODate("2024-01-01T10:00:00.000Z"),
    hourly: 24,
    vehicleType: "car",
    parkingFee: 140000,
    isDelete: false,
  },
  {
    _id: ObjectId("68aae42226542431e0de8504"),
    exit_recordId: ObjectId("67aae42226542431e0de8504"),
    licensePlate: "52A-12317",
    dateTime: ISODate("2024-01-01T11:00:00.000Z"),
    hourly: 6,
    vehicleType: "motor",
    parkingFee: 5000,
    isDelete: false,
  },
  {
    _id: ObjectId("68aae42226542431e0de8505"),
    exit_recordId: ObjectId("67aae42226542431e0de8505"),
    licensePlate: "52A-12318",
    dateTime: ISODate("2024-01-01T12:00:00.000Z"),
    hourly: 12,
    vehicleType: "car",
    parkingFee: 80000,
    isDelete: false,
  },
  {
    _id: ObjectId("68aae42226542431e0de8506"),
    exit_recordId: ObjectId("67aae42226542431e0de8506"),
    licensePlate: "52A-12319",
    dateTime: ISODate("2024-01-01T13:00:00.000Z"),
    hourly: 24,
    vehicleType: "motor",
    parkingFee: 10000,
    isDelete: false,
  },
  {
    _id: ObjectId("68aae42226542431e0de8507"),
    exit_recordId: ObjectId("67aae42226542431e0de8507"),
    licensePlate: "52A-12320",
    dateTime: ISODate("2024-01-01T14:00:00.000Z"),
    hourly: 6,
    vehicleType: "car",
    parkingFee: 50000,
    isDelete: false,
  },
  {
    _id: ObjectId("68aae42226542431e0de8508"),
    exit_recordId: ObjectId("67aae42226542431e0de8508"),
    licensePlate: "52A-12321",
    dateTime: ISODate("2024-01-01T15:00:00.000Z"),
    hourly: 12,
    vehicleType: "motor",
    parkingFee: 7000,
    isDelete: false,
  },
  {
    _id: ObjectId("68aae42226542431e0de8509"),
    exit_recordId: ObjectId("67aae42226542431e0de8509"),
    licensePlate: "52A-12322",
    dateTime: ISODate("2024-01-01T16:00:00.000Z"),
    hourly: 24,
    vehicleType: "car",
    parkingFee: 160000,
    isDelete: false,
  },
  {
    _id: ObjectId("68aae42226542431e0de8510"),
    exit_recordId: ObjectId("67aae42226542431e0de8510"),
    licensePlate: "52A-12323",
    dateTime: ISODate("2024-01-01T17:00:00.000Z"),
    hourly: 6,
    vehicleType: "motor",
    parkingFee: 5000,
    isDelete: false,
  }
]);


