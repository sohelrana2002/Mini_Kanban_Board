import { Response } from "express";
import { AuthRequest } from "../middlewares/auth";
import prisma from "../config/prisma";

// Create column
export const createColumn = async (req: AuthRequest, res: Response) => {
  try {
    const { title, boardId } = req.body;
    const userId = req.user!.id;

    //Check access
    const board = await prisma.board.findFirst({
      where: {
        id: boardId,
        OR: [{ ownerId: userId }, { members: { some: { userId } } }],
      },
    });

    if (!board)
      return res.status(403).json({
        success: false,
        message: "Don't have access to create column",
      });

    // Find column order
    const lastColumn = await prisma.column.findFirst({
      where: { boardId },
      orderBy: { order: "desc" },
    });

    const newOrder = lastColumn ? lastColumn.order + 1 : 0;

    const column = await prisma.column.create({
      data: {
        title,
        boardId,
        order: newOrder,
      },
    });

    res.status(201).json({
      success: true,
      message: "Column created successfully",
      columnId: column.id,
    });
  } catch (error: any) {
    console.log("Failed to create column error: ", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to create column",
    });
  }
};

// Delete column
export const deleteColumn = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const column = await prisma.column.findUnique({
      where: { id: Number(id) },
      include: { board: true },
    });

    if (!column)
      return res.status(404).json({
        success: false,
        message: "Column not found",
      });

    // Check access
    const board = await prisma.board.findFirst({
      where: {
        id: column.boardId,
        OR: [{ ownerId: userId }, { members: { some: { userId } } }],
      },
    });

    if (!board)
      return res.status(403).json({
        success: false,
        message: "Don't have access to delete column",
      });

    await prisma.column.delete({ where: { id: Number(id) } });
    res.status(200).json({
      success: true,
      message: "Successfully deleted Column",
      id,
    });
  } catch (error: any) {
    console.log("Failed to delete column error: ", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to delete column",
    });
  }
};
