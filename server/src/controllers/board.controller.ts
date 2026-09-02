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

// Individual board info
export const getBoardById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const board = await prisma.board.findFirst({
      where: {
        id: Number(id),
        OR: [{ ownerId: userId }, { members: { some: { userId } } }],
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        columns: {
          orderBy: { order: "asc" },
          include: {
            tasks: { orderBy: { position: "asc" } },
          },
        },
      },
    });

    if (!board) {
      return res.status(404).json({
        success: false,
        message: "Board not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Individual board fetch successfully",
      data: board,
    });
  } catch (error: any) {
    console.log("Fetch single board error: ", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch single board",
    });
  }
};
