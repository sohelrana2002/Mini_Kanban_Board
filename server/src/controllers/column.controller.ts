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
      message: "Internal server error",
    });
  }
};

// Fetch all columns
export const getColumns = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    // Query params
    const boardId = req.query.boardId
      ? parseInt(req.query.boardId as string)
      : undefined;
    const search = (req.query.search as string) || "";
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const skip = (page - 1) * limit;

    const whereClause: any = {
      board: {
        OR: [{ ownerId: userId }, { members: { some: { userId } } }],
      },
    };

    if (boardId) {
      whereClause.boardId = boardId;
    }

    if (search !== undefined) {
      whereClause.title = {
        contains: search.trim(),
        mode: "insensitive",
      };
    }

    const [columns, totalCount] = await Promise.all([
      prisma.column.findMany({
        where: whereClause,
        include: {
          board: {
            select: { id: true, title: true, ownerId: true },
          },
          tasks: {
            orderBy: { position: "asc" },
            include: {
              assignee: { select: { id: true, name: true, email: true } },
            },
          },
        },
        orderBy: [{ boardId: "asc" }, { order: "asc" }],
        skip,
        take: limit,
      }),

      prisma.column.count({
        where: whereClause,
      }),
    ]);

    if (columns.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No boards found for this user",
        data: {
          columns: [],
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
      message: "Columns fetched successfully",
      data: {
        columns,
        pagination: {
          total: totalCount,
          page,
          limit,
          totalPages: Math.ceil(totalCount / limit),
        },
      },
    });
  } catch (error: any) {
    console.log("Fetch columns error:", error.message);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get columns by id
export const getColumnById = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const columnId = parseInt(req.params.columnId);

    if (isNaN(columnId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid column ID",
      });
    }

    const column = await prisma.column.findFirst({
      where: {
        id: columnId,
        board: {
          OR: [{ ownerId: userId }, { members: { some: { userId } } }],
        },
      },
      include: {
        board: {
          select: { id: true, title: true, ownerId: true },
        },
        tasks: {
          orderBy: { position: "asc" },
          include: {
            assignee: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    if (!column) {
      return res.status(404).json({
        success: false,
        message: "Column not found or you don't have access",
      });
    }

    res.status(200).json({
      success: true,
      message: "Column fetched successfully",
      data: { column },
    });
  } catch (error: any) {
    console.log("Fetch single column error: ", error.message);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Update column
export const updateColumn = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const columnId = parseInt(req.params.columnId);
    const { title } = req.body;

    if (isNaN(columnId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid column ID",
      });
    }

    if (!title || title === undefined) {
      return res.status(400).json({
        success: false,
        message: "Title is required",
      });
    }

    const existingColumn = await prisma.column.findFirst({
      where: {
        id: columnId,
        board: {
          OR: [{ ownerId: userId }, { members: { some: { userId } } }],
        },
      },
      select: { id: true, boardId: true },
    });

    if (!existingColumn) {
      return res.status(404).json({
        success: false,
        message: "Column not found or you don't have access to update it",
      });
    }

    await prisma.column.update({
      where: { id: columnId },
      data: { title: title },
    });

    res.status(200).json({
      success: true,
      message: "Column updated successfully",
      columnId,
    });
  } catch (error: any) {
    console.log("Failed to update column error: ", error.message);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Delete column
export const deleteColumn = async (req: AuthRequest, res: Response) => {
  try {
    const { columnId: id } = req.params;
    const userId = req.user!.id;
    const columnId = Number(id);

    const existingColumn = await prisma.column.findFirst({
      where: {
        id: columnId,
        board: {
          OR: [{ ownerId: userId }, { members: { some: { userId } } }],
        },
      },
      select: { id: true, boardId: true },
    });

    if (!existingColumn)
      return res.status(404).json({
        success: false,
        message: "Column not found or you don't have access to delete it",
      });

    await prisma.$transaction([
      prisma.task.deleteMany({
        where: { columnId },
      }),
      prisma.column.delete({
        where: { id: columnId },
      }),
    ]);

    res.status(200).json({
      success: true,
      message: "Successfully deleted Column",
      columnId,
    });
  } catch (error: any) {
    console.log("Failed to delete column error: ", error.message);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
