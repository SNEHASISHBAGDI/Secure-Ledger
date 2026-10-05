require("dotenv").config();
const app = require("./src/app");
const connectToDB = require("./src/config/db");
const prisma = require("./src/config/prisma");

const PORT = process.env.PORT || 3000;

async function startServer() {
    // 1. Verify PostgreSQL database connection
    await connectToDB();

    // 2. Start HTTP server
    const server = app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });

    // 3. Graceful shutdown handler
    const gracefulShutdown = async () => {
        console.log("\nReceived shutdown signal. Closing server...");
        server.close(async () => {
            await prisma.$disconnect();
            console.log("Prisma client disconnected. Exiting process.");
            process.exit(0);
        });
    };

    process.on("SIGINT", gracefulShutdown);
    process.on("SIGTERM", gracefulShutdown);
}

startServer();