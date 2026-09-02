import { Response } from "express";
import { AuthRequest } from "../middlewares/auth";
import prisma from "../config/prisma";

// Create board
export const createBoard = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { title } = req.body;

    const board = await prisma.board.create({
      data: {
        title,
        ownerId: userId,
      },
    });

    res.status(201).json({
      success: true,
      message: "Board created successfully",
      id: board.id,
    });
  } catch (error: any) {
    console.log("Create board error: ", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to create board",
    });
  }
};
