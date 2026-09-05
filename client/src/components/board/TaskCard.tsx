"use client";

import { Draggable } from "@hello-pangea/dnd";
import { AlignLeft, FilePlus } from "lucide-react";
import type { Task } from "@/types";

export function TaskCard({
  task,
  index,
  onClick,
}: {
  task: Task;
  index: number;
  onClick: () => void;
}) {
  return (
    <Draggable draggableId={String(task.id)} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          className={`mb-2.5 cursor-pointer rounded-xl border border-ink-600 bg-ink-900 p-3.5 text-left shadow-sm transition hover:border-ink-400 ${
            snapshot.isDragging ? "rotate-1 border-amber-400/50 shadow-lg" : ""
          }`}
        >
          <p className="text-sm font-medium leading-snug text-mist-100 line-clamp-3">
            {task.title}
          </p>

          {(task.description || task.assignee) && (
            <div className="mt-3 flex items-center justify-between">
              <span className="flex items-center gap-1 text-xs text-mist-700">
                <AlignLeft size={13} />
              </span>

              {task.assignee && (
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <FilePlus size={13} />
                  <span>{task.assignee.name}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
}
