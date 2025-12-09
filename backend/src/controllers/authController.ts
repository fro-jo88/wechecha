import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../prismaClient";
import { Request, Response } from "express";

export const register = async (req: Request, res: Response) => {
    try {
        const { name, email, password, role, locationId } = req.body;

        // Validate required fields
        if (!name || !email || !password || !role) {
            return res.status(400).json({
                error: "Name, email, password, and role are required"
            });
        }

        // Check if email already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return res.status(400).json({
                error: "Email already in use"
            });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create user
        const user = await prisma.user.create({
            data: {
                name,
                email,
                passwordHash,
                role,
                locationId: locationId || null,
                isActive: true
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                locationId: true,
                isActive: true
            }
        });

        return res.status(201).json({
            message: "User created successfully",
            user
        });
    } catch (err) {
        console.error("Register error:", err);
        return res.status(500).json({ error: "Failed to create user" });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(400).json({ error: "Invalid email or password" });

        if (!user.isActive) {
            return res.status(403).json({ error: "Account disabled." });
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) return res.status(400).json({ error: "Invalid email or password" });

        const token = jwt.sign(
            {
                id: user.id,
                role: user.role,
                locationId: user.locationId
            },
            process.env.JWT_SECRET || "default-secret-change-in-production",
            { expiresIn: "7d" }
        );

        return res.json({
            token, user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                locationId: user.locationId
            }
        });
    } catch (err) {
        console.error("Login error:", err);
        return res.status(500).json({ error: "Login failed" });
    }
};

export const getMe = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                locationId: true,
                location: { select: { name: true, type: true } }
            }
        });

        if (!user) return res.status(404).json({ error: "User not found" });

        return res.json({ data: user });
    } catch (err) {
        console.error("GetMe error:", err);
        return res.status(500).json({ error: "Failed to fetch user profile" });
    }
};

export const updateProfile = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        const { name, email } = req.body;

        if (!userId) return res.status(401).json({ error: "Unauthorized" });
        if (!name || !email) return res.status(400).json({ error: "Name and email are required" });

        // Check if email is taken by another user
        const existing = await prisma.user.findFirst({
            where: { email, id: { not: userId } }
        });

        if (existing) return res.status(400).json({ error: "Email already in use" });

        const user = await prisma.user.update({
            where: { id: userId },
            data: { name, email },
            select: { id: true, name: true, email: true, role: true }
        });

        return res.json({ message: "Profile updated successfully", data: user });
    } catch (err) {
        console.error("UpdateProfile error:", err);
        return res.status(500).json({ error: "Failed to update profile" });
    }
};

export const updatePassword = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        const { currentPassword, newPassword } = req.body;

        if (!userId) return res.status(401).json({ error: "Unauthorized" });
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: "Current and new password are required" });
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return res.status(404).json({ error: "User not found" });

        const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isMatch) return res.status(400).json({ error: "Incorrect current password" });

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: userId },
            data: { passwordHash: hashedPassword }
        });

        return res.json({ message: "Password updated successfully" });
    } catch (err) {
        console.error("UpdatePassword error:", err);
        return res.status(500).json({ error: "Failed to update password" });
    }
};
