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

// Shared board with other users and added
export const shareBoard = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { userEmail } = req.body;
    const userId = req.user!.id;

    // Check owner board
    const board = await prisma.board.findFirst({
      where: { id: Number(id), ownerId: userId },
    });

    if (!board) {
      return res.status(404).json({
        success: false,
        message: "Board not found or you are not the owner",
      });
    }

    // Check user exist or not?
    const userToAdd = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!userToAdd) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // // Check user already exist or not?
    const existing = await prisma.boardMember.findUnique({
      where: {
        boardId_userId: { boardId: Number(id), userId: userToAdd.id },
      },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "User already exist to this board",
      });
    }

    await prisma.boardMember.create({
      data: {
        boardId: Number(id),
        userId: userToAdd.id,
      },
    });

    res.status(200).json({
      success: true,
      message: `Board shared with ${userEmail}`,
    });
  } catch (error: any) {
    console.log("Failed to share boar error: ", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to Failed to share boar",
    });
  }
};
