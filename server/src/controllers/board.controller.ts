import type { Prisma } from "@prisma/client";
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
      message: "Internal server error",
    });
  }
};

//  Update Board
export const updateBoardTitle = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const boardId = parseInt(req.params.boardId);
  const { title } = req.body;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized User",
    });
  }

  if (!title || title.trim() === "") {
    return res.status(400).json({
      success: false,
      message: "Title is required",
    });
  }

  try {
    const board = await prisma.board.findUnique({
      where: { id: boardId },
      select: { ownerId: true },
    });

    if (!board) {
      return res.status(404).json({
        success: false,
        message: "Board not found",
      });
    }

    if (board.ownerId !== userId) {
      return res.status(403).json({
        success: false,
        message: "You are not the owner of this board",
      });
    }

    await prisma.board.update({
      where: { id: boardId },
      data: { title: title.trim() },
    });

    return res.status(200).json({
      success: true,
      message: "Board title updated successfully",
      boardId,
    });
  } catch (error: any) {
    console.error("Failed to update board error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Remove board member
export const removeBoardMember = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const boardId = parseInt(req.params.boardId);
  const memberId = parseInt(req.params.memberId);

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized access",
    });
  }

  if (isNaN(boardId) || isNaN(memberId)) {
    return res.status(400).json({
      success: false,
      message: "Board ID and Member ID required",
    });
  }

  try {
    const board = await prisma.board.findUnique({
      where: { id: boardId },
      select: { ownerId: true },
    });

    if (!board) {
      return res.status(404).json({
        success: false,
        message: "Board not found",
      });
    }

    if (board.ownerId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Only the board owner can remove members",
      });
    }

    if (memberId === board.ownerId) {
      return res.status(400).json({
        success: false,
        message: "Cannot remove the board owner",
      });
    }

    const memberRecord = await prisma.boardMember.findUnique({
      where: {
        boardId_userId: {
          boardId: boardId,
          userId: memberId,
        },
      },
    });

    if (!memberRecord) {
      return res.status(404).json({
        success: false,
        message: "User is not a member of this board",
      });
    }

    await prisma.boardMember.delete({
      where: {
        boardId_userId: {
          boardId: boardId,
          userId: memberId,
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: "Member removed from the board successfully",
      memberId,
    });
  } catch (error: any) {
    console.error("Failed to remove board error error: ", error.message);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get all board
export const getBoards = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const search = req.query.search as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    // Pagination
    const skip = (page - 1) * limit;

    const whereClause: Prisma.BoardWhereInput = {
      OR: [{ ownerId: userId }, { members: { some: { userId } } }],
    };

    // Search function
    if (search !== undefined) {
      whereClause.title = {
        contains: search.trim(),
        mode: "insensitive",
      };
    }

    const [boards, totalCount] = await Promise.all([
      prisma.board.findMany({
        where: whereClause,
        include: {
          owner: { select: { id: true, name: true, email: true } },
          members: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
          columns: {
            orderBy: { order: "asc" },
            include: {
              tasks: { orderBy: { position: "asc" } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: skip,
        take: limit,
      }),

      prisma.board.count({
        where: whereClause,
      }),
    ]);

    if (boards.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No boards found for this user",
        data: {
          boards: [],
          pagination: {
            total: 0,
            page: page,
            limit: limit,
            totalPages: 0,
          },
        },
      });
    }

    res.status(200).json({
      success: true,
      message: "Fetch all boards successfully",
      data: {
        boards: boards,
        pagination: {
          total: totalCount,
          page: page,
          limit: limit,
          totalPages: Math.ceil(totalCount / limit),
        },
      },
    });
  } catch (error: any) {
    console.log("Fetch all board error: ", error.message);

    res.status(500).json({
      success: false,
      message: "Internal server error",
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
            tasks: {
              orderBy: { position: "asc" },
              include: {
                assignee: { select: { id: true, name: true, email: true } },
              },
            },
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
      message: "Internal server error",
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
    console.log("Failed to share board error: ", error.message);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Delete board
export const deleteBoard = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const boardId = Number(id);

    const board = await prisma.board.findFirst({
      where: {
        id: boardId,
        ownerId: userId,
      },
    });

    if (!board) {
      return res.status(404).json({
        success: false,
        message: "Board not found or you are not the owner",
      });
    }

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const columns = await tx.column.findMany({
        where: { boardId },
        select: { id: true },
      });
      const columnIds = columns.map((col: { id: number }) => col.id);

      if (columnIds.length > 0) {
        await tx.task.deleteMany({
          where: { columnId: { in: columnIds } },
        });
      }

      await tx.column.deleteMany({
        where: { boardId },
      });

      await tx.board.delete({
        where: { id: boardId },
      });
    });

    res.status(200).json({
      success: true,
      message: "Board deleted successfully",
      boardId: id,
    });
  } catch (error: any) {
    console.log("Failed to delete board error: ", error.message);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
