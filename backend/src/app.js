const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const app = express();

const allowedOrigins = [
  "http://127.0.0.1:5500",
  "http://localhost:5173",
  "https://atomicedger-1.onrender.com",
  ...(process.env.CLIENT_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    return callback(null, allowedOrigins.includes(origin));
  },
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

const authRouter = require("./routes/auth.routes");
const accountRouter = require("./routes/account.routes");
const transactionRoutes = require("./routes/transaction.routes");

app.get("/", (req, res) => {
  res.send("Ledger Service is up and running");
});

app.use("/api/auth", authRouter);
app.use("/api/accounts", accountRouter);
app.use("/api/transactions", transactionRoutes);

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);

  console.error("Unhandled API error:", {
    method: req.method,
    name: error?.name,
    code: error?.code
  });
  const isDatabaseError =
    typeof error?.code === "string" && /^P\d{4}$/.test(error.code) ||
    error?.name?.startsWith("Prisma");

  return res.status(500).json({
    message: isDatabaseError ? "Database service unavailable" : "Internal server error",
    code: isDatabaseError ? "DATABASE_ERROR" : "INTERNAL_SERVER_ERROR"
  });
});

module.exports = app;