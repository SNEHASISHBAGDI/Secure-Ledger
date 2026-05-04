const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const app = express();

// ✅ Allowed origins (local + deployed frontend)
const allowedOrigins = [
  "http://127.0.0.1:5500",
  "http://localhost:5173",
  "https://atomicledger-1.onrender.com" // <-- Remove the trailing slash here
];

// ✅ CORS middleware
app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (Postman, mobile apps, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));

// ✅ Middlewares
app.use(express.json());
app.use(cookieParser());

// ✅ Routes
const authRouter = require("./routes/auth.routes");
const accountRouter = require("./routes/account.routes");
const transactionRoutes = require("./routes/transaction.routes");

// ✅ Health check route
app.get("/", (req, res) => {
  res.send("Ledger Service is up and running");
});

// ✅ API routes
app.use("/api/auth", authRouter);
app.use("/api/accounts", accountRouter);
app.use("/api/transactions", transactionRoutes);

module.exports = app;