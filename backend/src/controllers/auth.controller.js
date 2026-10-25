const prisma = require("../config/prisma");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const emailService = require("../services/email.service");

function isDuplicateEmailConflict(error) {
    if (error?.code !== "P2002") return false;

    const target = error.meta?.target;
    const targets = Array.isArray(target) ? target : [target];
    const constraint = error.meta?.constraint;

    return targets.some((value) =>
        value === "email" || value === "User_email_key"
    ) || constraint === "User_email_key";
}

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

        const hashedPassword = await bcrypt.hash(password, 10);

        // Atomic provisioning of user and initial customer account
        const [user, account] = await prisma.$transaction(async (tx) => {
            const newUser = await tx.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    name
                }
            });

            const newAccount = await tx.account.create({
                data: {
                    userId: newUser.id,
                    role: "CUSTOMER",
                    currency: "INR"
                }
            });

            return [newUser, newAccount];
        });

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "3d" });

        res.cookie("token", token);

        res.status(201).json({
            user: {
                _id: user.id,
                email: user.email,
                name: user.name
            },
            account: {
                _id: account.id,
                currency: account.currency
            },
            token
        });

        await emailService.sendRegistrationEmail(user.email, user.name);

    } catch (error) {
        if (isDuplicateEmailConflict(error)) {
            return res.status(422).json({
                message: "User already exists with email.",
                status: "failed"
            });
        }
        console.error("Registration error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

async function userLoginController(req, res) {
    const { email, password } = req.body || {};

    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({
                message: "Email or password is INVALID"
            });
        }

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "3d" });
        res.cookie("token", token);

        return res.status(200).json({
            user: {
                _id: user.id,
                email: user.email,
                name: user.name
            },
            token
        });
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

async function userLogoutController(req, res) {
    const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];

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
        if (error.code !== "P2002") {
            console.error("Logout error:", error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }

    res.clearCookie("token");
    return res.status(200).json({
        message: "User logged out successfully"
    });
}

module.exports = {
    userRegisterController,
    userLoginController,
    userLogoutController
};