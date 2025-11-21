export type Priority = "High" | "Medium" | "Low";

export interface Task {
  id: string;
  title: string;
  dueDate: string;
  dueTime: string;
  priority: Priority;
  reminder: boolean;
  completed: boolean;
  createdAt: string;
}

export interface Message {
  id: string;
  text: string;
  sender: "user" | "assistant";
  timestamp: string;
}

export type ConversationState =
  | "idle"
  | "adding-task-title"
  | "adding-task-date"
  | "adding-task-priority"
  | "adding-task-reminder"
  | "updating-task-select"
  | "updating-task-field"
  | "deleting-task-select"
  | "confirming-action";

export interface ConversationContext {
  state: ConversationState;
  currentTask?: Partial<Task>;
  selectedTaskId?: string;
  updateField?: string;
}
