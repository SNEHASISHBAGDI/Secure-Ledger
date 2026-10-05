const prisma = require("./prisma");

async function connectToDB() {
    try {
        await prisma.$connect();
        console.log("Server is connected to PostgreSQL via Prisma");
    } catch (err) {
        console.error("Error connecting to PostgreSQL DB:", err);
        process.exit(1);
    }
}

module.exports = connectToDB;