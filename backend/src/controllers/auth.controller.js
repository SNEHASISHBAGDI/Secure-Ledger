const prisma = require("../config/prisma");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const emailService = require("../services/email.service");

/**
 * - user register controller
 * - POST /api/auth/register
 */
async function userRegisterController(req, res) {
    const { email, password, name } = req.body;

    try {
        const isExists = await prisma.user.findUnique({
            where: { email }
        });

        if (isExists) {
            return res.status(422).json({
                message: "User already exists with email.",
                status: "failed"
            });
        }

        // Explicitly hash password since Mongoose pre-save is gone
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name
            }
        });

        // Use PostgreSQL UUID for the token payload
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "3d" });

        res.cookie("token", token);

        res.status(201).json({
            user: {
                _id: user.id, // Mapped to '_id' for frontend compatibility
                email: user.email,
                name: user.name
            },
            token
        });

        await emailService.sendRegistrationEmail(user.email, user.name);

    } catch (error) {
        // Handle race conditions where email is registered concurrently
        if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
            return res.status(422).json({
                message: "User already exists with email.",
                status: "failed"
            });
        }
        console.error("Registration error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

/**
 * - User Login Controller
 * - POST /api/auth/login
 */
async function userLoginController(req, res) {
    const { email, password } = req.body;

    try {
        const user = await prisma.user.findUnique({ 
            where: { email } 
        });

        if (!user) {
            return res.status(401).json({
                message: "Email or password is INVALID"
            });
        }

        // Explicitly compare passwords
        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            return res.status(401).json({
                message: "Email or password is INVALID"
            });
        }

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "3d" });

        res.cookie("token", token);

        res.status(200).json({
            user: {
                _id: user.id, // Mapped to '_id' for frontend compatibility
                email: user.email,
                name: user.name
            },
            token
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

/**
 * - User Logout Controller
 * - POST /api/auth/logout
 */
async function userLogoutController(req, res) {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[ 1 ];

    if (!token) {
        return res.status(200).json({
            message: "User logged out successfully"
        });
    }

    try {
        await prisma.tokenBlacklist.create({
            data: { token }
        });
    } catch (error) {
        // If P2002 occurs, the token is already blacklisted; ignore and proceed with logout
        if (error.code !== 'P2002') {
            console.error("Logout error:", error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }

    res.clearCookie("token");

    res.status(200).json({
        message: "User logged out successfully"
    });
}

module.exports = {
    userRegisterController,
    userLoginController,
    userLogoutController
};