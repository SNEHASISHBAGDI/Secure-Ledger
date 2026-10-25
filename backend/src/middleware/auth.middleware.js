const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");

async function authMiddleware(req, res, next) {
    const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({
            message: "Unauthorized access, token is missing"
        });
    }

    try {
        const isBlacklisted = await prisma.tokenBlacklist.findUnique({
            where: { token }
        });

        if (isBlacklisted) {
            return res.status(401).json({
                message: "Unauthorized access, token is invalid"
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId }
        });

        if (!user) {
            return res.status(401).json({
                message: "Unauthorized access, token is invalid"
            });
        }

        req.user = user;
        return next();
    } catch (err) {
        if (err.name !== "JsonWebTokenError" && err.name !== "TokenExpiredError" && err.name !== "NotBeforeError") {
            return next(err);
        }
        return res.status(401).json({
            message: "Unauthorized access, token is invalid"
        });
    }
}

async function authSystemUserMiddleware(req, res, next) {
    const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({
            message: "Unauthorized access, token is missing"
        });
    }

    try {
        const isBlacklisted = await prisma.tokenBlacklist.findUnique({
            where: { token }
        });

        if (isBlacklisted) {
            return res.status(401).json({
                message: "Unauthorized access, token is invalid"
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId }
        });

        if (!user || !user.systemUser) {
            return res.status(403).json({
                message: "Forbidden access, not a system user"
            });
        }

        req.user = user;
        return next();
    } catch (err) {
        if (err.name !== "JsonWebTokenError" && err.name !== "TokenExpiredError" && err.name !== "NotBeforeError") {
            return next(err);
        }
        return res.status(401).json({
            message: "Unauthorized access, token is invalid"
        });
    }
}

module.exports = {
    authMiddleware,
    authSystemUserMiddleware
};