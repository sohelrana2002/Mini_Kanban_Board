import { Request, Response } from "express";
import prisma from "../config/prisma";
import { hashPassword } from "../utils/bcrypt";
import { generateToken } from "../utils/jwt";

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name },
    });

    const token = generateToken(user.id, user.email);

    res.status(201).json({
      success: true,
      token,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (error: any) {
    console.log("User registration error: ", error.message);

    res.status(500).json({
      success: false,
      message: "Registration failed",
    });
  }
};
