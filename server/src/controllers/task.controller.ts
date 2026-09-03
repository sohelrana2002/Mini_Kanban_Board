import { Response } from "express";
import { AuthRequest } from "../middlewares/auth";
import prisma from "../config/prisma";

// Create task
export const createTask = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, columnId } = req.body;
    const userId = req.user!.id;

    // Check access
    const column = await prisma.column.findUnique({
      where: { id: columnId },
      include: { board: true },
    });

    if (!column)
      return res.status(404).json({
        success: false,
        message: "Column not found",
      });

    const board = await prisma.board.findFirst({
      where: {
        id: column.boardId,
        OR: [{ ownerId: userId }, { members: { some: { userId } } }],
      },
    });
    if (!board)
      return res.status(403).json({
        success: false,
        message: "Don't have access to create task",
      });

    // Find posiiton
    const lastTask = await prisma.task.findFirst({
      where: { columnId },
      orderBy: { position: "desc" },
    });
    const newPosition = lastTask ? lastTask.position + 1 : 0;

    const task = await prisma.task.create({
      data: {
        title,
        description,
        columnId,
        position: newPosition,
        assigneeId: userId,
      },
    });

    res.status(201).json({
      success: true,
      message: "Created task successfully",
      taskId: task.id,
    });
  } catch (error: any) {
    console.log("Failed to create task: ", error.message);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get all task
export const getTasks = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const columnId = req.query.columnId
      ? parseInt(req.query.columnId as string)
      : undefined;
    const search = (req.query.search as string) || "";
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    // Pagination
    const skip = (page - 1) * limit;

    let boardIds: number[] = [];

    if (columnId) {
      const column = await prisma.column.findUnique({
        where: { id: columnId },
        include: { board: true },
      });

      if (!column) {
        return res.status(404).json({
          success: false,
          message: "Column not found",
        });
      }

      const board = await prisma.board.findFirst({
        where: {
          id: column.boardId,
          OR: [{ ownerId: userId }, { members: { some: { userId } } }],
        },
        select: { id: true },
      });

      if (!board) {
        return res.status(403).json({
          success: false,
          message: "You don't have access to this column's board",
        });
      }

      boardIds = [column.boardId];
    } else {
      const accessibleBoards = await prisma.board.findMany({
        where: {
          OR: [{ ownerId: userId }, { members: { some: { userId } } }],
        },
        select: { id: true },
      });
      boardIds = accessibleBoards.map((b) => b.id);

      if (boardIds.length === 0) {
        return res.status(200).json({
          success: true,
          message: "No accessible boards found",
          data: {
            tasks: [],
            pagination: {
              total: 0,
              page,
              limit,
              totalPages: 0,
            },
          },
        });
      }
    }

    const whereClause: any = {
      column: {
        boardId: { in: boardIds },
      },
    };

    if (columnId) {
      whereClause.columnId = columnId;
    }

    if (search !== undefined) {
      whereClause.OR = [
        { title: { contains: search.trim(), mode: "insensitive" } },
      ];
    }

    const [tasks, totalCount] = await Promise.all([
      prisma.task.findMany({
        where: whereClause,
        include: {
          column: {
            select: { id: true, title: true, boardId: true },
          },
          assignee: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: [{ columnId: "asc" }, { position: "asc" }],
        skip,
        take: limit,
      }),

      prisma.task.count({ where: whereClause }),
    ]);

    res.status(200).json({
      success: true,
      message: "Tasks fetched successfully",
      data: {
        tasks,
        pagination: {
          total: totalCount,
          page,
          limit,
          totalPages: Math.ceil(totalCount / limit),
        },
      },
    });
  } catch (error: any) {
    console.log("Fetch tasks error: ", error.message);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Delete task
export const deleteTask = async (req: AuthRequest, res: Response) => {
  try {
    const { taskId } = req.params;
    const userId = req.user!.id;

    const task = await prisma.task.findUnique({
      where: { id: Number(taskId) },
      include: { column: { include: { board: true } } },
    });

    if (!task)
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });

    const board = await prisma.board.findFirst({
      where: {
        id: task.column.board.id,
        OR: [{ ownerId: userId }, { members: { some: { userId } } }],
      },
    });

    if (!board)
      return res.status(403).json({
        success: false,
        message: "Don't have access to delete task",
      });

    await prisma.task.delete({ where: { id: Number(taskId) } });

    res.status(200).json({
      success: true,
      message: "Deleted task successfully",
      taskId,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete task" });
  }
};

// Task move
export const moveTask = async (req: AuthRequest, res: Response) => {
  try {
    const { taskId: id } = req.params;
    const { targetColumnId, newPosition } = req.body;
    const userId = req.user!.id;

    const taskId = Number(id);
    const targetColId = Number(targetColumnId);
    const newPos = Number(newPosition);

    // Find task
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { column: { include: { board: true } } },
    });

    if (!task)
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });

    const sourceColId = task.columnId;
    const oldPos = task.position;

    // Check access the source of board
    const sourceBoard = await prisma.board.findFirst({
      where: {
        id: task.column.board.id,
        OR: [{ ownerId: userId }, { members: { some: { userId } } }],
      },
    });

    if (!sourceBoard)
      return res.status(403).json({
        success: false,
        message: "Don't access to move task",
      });

    // It target column is defferent then check target source
    if (sourceColId !== targetColId) {
      const targetColumn = await prisma.column.findUnique({
        where: { id: targetColId },
        include: { board: true },
      });

      if (!targetColumn)
        return res.status(404).json({
          success: false,
          message: "Target column not found",
        });

      const targetBoard = await prisma.board.findFirst({
        where: {
          id: targetColumn.board.id,
          OR: [{ ownerId: userId }, { members: { some: { userId } } }],
        },
      });

      if (!targetBoard)
        return res.status(403).json({
          success: false,
          message: "Don't access to target board",
        });
    } else {
      const tasksInCol = await prisma.task.count({
        where: { columnId: sourceColId },
      });

      if (newPos < 0 || newPos >= tasksInCol) {
        return res.status(400).json({
          success: false,
          message: "Invalid position",
        });
      }
    }

    // Update all
    await prisma.$transaction(async (tx) => {
      if (sourceColId === targetColId) {
        if (oldPos < newPos) {
          await tx.task.updateMany({
            where: {
              columnId: sourceColId,
              position: { gt: oldPos, lte: newPos },
            },
            data: { position: { decrement: 1 } },
          });
        } else if (oldPos > newPos) {
          await tx.task.updateMany({
            where: {
              columnId: sourceColId,
              position: { gte: newPos, lt: oldPos },
            },
            data: { position: { increment: 1 } },
          });
        }

        await tx.task.update({
          where: { id: taskId },
          data: { position: newPos },
        });
      } else {
        await tx.task.updateMany({
          where: {
            columnId: sourceColId,
            position: { gt: oldPos },
          },
          data: { position: { decrement: 1 } },
        });

        await tx.task.updateMany({
          where: {
            columnId: targetColId,
            position: { gte: newPos },
          },
          data: { position: { increment: 1 } },
        });

        await tx.task.update({
          where: { id: taskId },
          data: {
            columnId: targetColId,
            position: newPos,
          },
        });
      }
    });

    res.status(200).json({
      success: true,
      message: "Task moved successfully",
      taskId: id,
    });
  } catch (error: any) {
    console.log("Failed to move task: ", error.message);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
