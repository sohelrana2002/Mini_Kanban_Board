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
      message: "Failed to create task",
    });
  }
};

// Delete task
export const deleteTask = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const task = await prisma.task.findUnique({
      where: { id: Number(id) },
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

    await prisma.task.delete({ where: { id: Number(id) } });

    res.status(200).json({
      success: true,
      message: "Deleted task successfully",
      taskId: id,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete task" });
  }
};
