const express = require("express");
const ErrorHandler = require("./middleware/error");
const app = express();
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const cors = require("cors");

// app.use(
//   cors(
//   )
// );

// app.use(
//   cors({
//     origin: "https://administrasi-kec-katapang.vercel.app", // Ganti dengan domain front-end Anda
//     methods: ["GET", "POST", "PUT", "DELETE"], // Metode HTTP yang diizinkan
//     credentials: true, // Mengizinkan cookie dikirim dalam permintaan lintas domain
//   })
// );


app.use(
  cors({
    origin: "*", // Mengizinkan semua origin
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Mengizinkan semua metode
    credentials: true, // Jika Anda menggunakan cookie
  })
);


app.use(express.json());
app.use(cookieParser());

app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));

// config
if (process.env.NODE_ENV !== "PRODUCTION") {
  require("dotenv").config({
    path: "config/.env",
  });
}

// import routes
const user = require("./controller/user");
const product = require("./controller/product");
const category = require("./controller/category");
const tipeNota = require("./controller/tipeNota");
const lokasiSimpan = require("./controller/lokasiSimpan");
const supplier = require("./controller/supplier");
const barangMasuk = require("./controller/barangMasuk");
const barangKeluar = require("./controller/barangKeluar");
const customer = require("./controller/customer");
const vendor = require("./controller/vendor");

// define routes
app.use("/users", user);
app.use("/products", product);
app.use("/categories", category);
app.use("/tipe-nota", tipeNota);
app.use("/lokasi-simpan", lokasiSimpan);
app.use("/suppliers", supplier);
app.use("/barang-masuk", barangMasuk);
app.use("/barang-keluar", barangKeluar);
app.use("/customers", customer);
app.use("/vendors", vendor);
// it's for ErrorHandling
app.use(ErrorHandler);

module.exports = app;
