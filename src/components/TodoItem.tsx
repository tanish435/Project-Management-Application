import { Draggable } from "@hello-pangea/dnd";
import { useState } from "react";
import { Checkbox } from "./ui/checkbox";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import ChangeTodoMembers from "./ChangeTodoMembers";
import { Trash2 } from "lucide-react";
import axios, { AxiosError } from "axios";
import { toast } from "sonner";
import { Todo, User } from "@/types/interface";

interface ApiResponse {
  success: boolean;
  message: string;
  data: Todo;
}

interface Props {
  todo: Todo;
  index: number;
  checklistId: string;
  cardId: string;
  cardMembers: User[];
  setChecklists: React.Dispatch<React.SetStateAction<any[]>>;
}

export default function TodoItem({
  todo,
  index,
  checklistId,
  cardId,
  cardMembers,
  setChecklists,
}: Props) {
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState(todo.content);

  const toggleTodoStatus = async () => {
    try {
      const response = await axios.patch(
        `/api/todos/toggleCompleteStatus/${cardId}/${checklistId}/${todo._id}`
      );

      if (response.data.success) {
        setChecklists((prev) =>
          prev.map((checklist) =>
            checklist._id === checklistId
              ? {
                  ...checklist,
                  todos: checklist.todos.map((t: Todo) =>
                    t._id === todo._id ? response.data.data : t
                  ),
                }
              : checklist
          )
        );
      }
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      toast.error("Failed to toggle todo complete status", {
        description: axiosError.response?.data.message || "Unknown error",
      });
    }
  };

  const handleSave = async () => {
    try {
      const response = await axios.patch(
        `/api/todos/updateTodoContent/${cardId}/${checklistId}/${todo._id}`,
        { content: editedContent }
      );

      if (response.data.success) {
        setChecklists((prev) =>
          prev.map((checklist) =>
            checklist._id === checklistId
              ? {
                  ...checklist,
                  todos: checklist.todos.map((t: Todo) =>
                    t._id === todo._id ? response.data.data : t
                  ),
                }
              : checklist
          )
        );
        setEditingTodoId(null);
      }
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      toast.error("Failed to update todo content", {
        description: axiosError.response?.data.message || "Unknown error",
      });
    }
  };

  const deleteTodo = async () => {
    try {
      const response = await axios.delete(
        `/api/todos/deleteTodo/${cardId}/${checklistId}/${todo._id}`
      );

      if (response.data.success) {
        setChecklists((prev) =>
          prev.map((checklist) =>
            checklist._id === checklistId
              ? {
                  ...checklist,
                  todos: checklist.todos.filter((t: Todo) => t._id !== todo._id),
                }
              : checklist
          )
        );
        setEditingTodoId(null);
      }
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      toast.error("Failed to delete todo", {
        description: axiosError.response?.data.message || "Unknown error",
      });
    }
  };

  return (
    <Draggable draggableId={todo._id} index={index}>
      {(provided) => (
        <div
          {...provided.draggableProps}
          ref={provided.innerRef}
          className="w-full bg-gray-800 p-2 pt-1 rounded-md"
        >
          <div className="flex items-start gap-2" {...provided.dragHandleProps}>
            <Checkbox
              checked={todo.complete}
              onCheckedChange={toggleTodoStatus}
              className="mt-1 bg-gray-900 border-gray-500 data-[state=checked]:bg-blue-400 data-[state=checked]:text-black data-[state=checked]:border-0 rounded-sm"
            />

            <div className="flex-1">
              {editingTodoId === todo._id ? (
                <div className="space-y-2">
                  <Textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className="resize-y w-full min-h-[40px] bg-gray-800 text-sm text-gray-200"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSave}
                      className="rounded-sm bg-blue-500 hover:bg-[#75b2fb] text-black px-3 py-1"
                    >
                      Save
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setEditingTodoId(null)}
                      className="hover:bg-[#5f6671] px-3 text-gray-300"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  className="text-sm text-gray-200 hover:bg-gray-700 p-1 rounded cursor-pointer group flex justify-between items-center"
                  onClick={() => {
                    setEditingTodoId(todo._id);
                    setEditedContent(todo.content);
                  }}
                >
                  <span>{todo.content}</span>
                  <div className="flex gap-1 items-center opacity-0 group-hover:opacity-100">
                    <ChangeTodoMembers
                      cardId={cardId}
                      checklistId={checklistId}
                      todoId={todo._id}
                      todoMembers={todo.assignedTo}
                      cardMembers={cardMembers}
                      setTodoMembers={(updatedMembers: User[]) => {
                        setChecklists((prev) =>
                          prev.map((list) =>
                            list._id === checklistId
                              ? {
                                  ...list,
                                  todos: list.todos.map((t: Todo) =>
                                    t._id === todo._id
                                      ? { ...t, assignedTo: updatedMembers }
                                      : t
                                  ),
                                }
                              : list
                          )
                        );
                      }}
                    />
                    <span
                      onClick={deleteTodo}
                      className="bg-[#404a57] hover:bg-gray-500 p-1 rounded-full"
                    >
                      <Trash2 className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}
