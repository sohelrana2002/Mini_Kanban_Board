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

// Get all board
export const getBoards = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const boards = await prisma.board.findMany({
      where: {
        OR: [{ ownerId: userId }, { members: { some: { userId } } }],
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        columns: { orderBy: { order: "asc" } },
      },
    });

    res.status(200).json({
      success: true,
      message: "Fetch all boards successfully",
      data: { boards },
    });
  } catch (error: any) {
    console.log("Fetch all board error: ", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch board",
    });
  }
};
