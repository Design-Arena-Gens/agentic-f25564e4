import { Task, Priority, ConversationContext, Message } from "../types";

export class TaskAssistant {
  private tasks: Task[];
  private context: ConversationContext;

  constructor(tasks: Task[], context: ConversationContext) {
    this.tasks = tasks;
    this.context = context;
  }

  processMessage(userMessage: string): {
    response: string;
    newContext: ConversationContext;
    updatedTasks?: Task[];
  } {
    const lowerMessage = userMessage.toLowerCase().trim();

    // Detect intent if idle
    if (this.context.state === "idle") {
      if (
        lowerMessage.includes("add") ||
        lowerMessage.includes("create") ||
        lowerMessage.includes("new task")
      ) {
        return {
          response: "What is the task?",
          newContext: {
            state: "adding-task-title",
            currentTask: {},
          },
        };
      } else if (
        lowerMessage.includes("update") ||
        lowerMessage.includes("edit") ||
        lowerMessage.includes("change")
      ) {
        if (this.tasks.length === 0) {
          return {
            response: "You don't have any tasks yet. Would you like to add one?",
            newContext: { state: "idle" },
          };
        }
        return {
          response: this.formatTaskList("Which task would you like to update?"),
          newContext: { state: "updating-task-select" },
        };
      } else if (lowerMessage.includes("delete") || lowerMessage.includes("remove")) {
        if (this.tasks.length === 0) {
          return {
            response: "You don't have any tasks to delete.",
            newContext: { state: "idle" },
          };
        }
        return {
          response: this.formatTaskList("Which task would you like to delete?"),
          newContext: { state: "deleting-task-select" },
        };
      } else if (
        lowerMessage.includes("view") ||
        lowerMessage.includes("show") ||
        lowerMessage.includes("list") ||
        lowerMessage.includes("tasks")
      ) {
        if (this.tasks.length === 0) {
          return {
            response: "You don't have any tasks yet. Want to add one?",
            newContext: { state: "idle" },
          };
        }
        return {
          response: this.formatTaskList("Here are your tasks:"),
          newContext: { state: "idle" },
        };
      } else {
        return {
          response:
            "Hi! I can help you with tasks. You can:\n\n• Add a new task\n• Update a task\n• Delete a task\n• View all tasks\n\nWhat would you like to do?",
          newContext: { state: "idle" },
        };
      }
    }

    // Handle task creation flow
    if (this.context.state === "adding-task-title") {
      return {
        response: "What is the due date & time? (e.g., Tomorrow 3pm, Dec 25 2pm)",
        newContext: {
          state: "adding-task-date",
          currentTask: { title: userMessage },
        },
      };
    }

    if (this.context.state === "adding-task-date") {
      const { date, time } = this.parseDateTime(userMessage);
      return {
        response: "Any priority? (High/Medium/Low)",
        newContext: {
          state: "adding-task-priority",
          currentTask: {
            ...this.context.currentTask,
            dueDate: date,
            dueTime: time,
          },
        },
      };
    }

    if (this.context.state === "adding-task-priority") {
      const priority = this.parsePriority(userMessage);
      return {
        response: "Do you want to add a reminder? (Yes/No)",
        newContext: {
          state: "adding-task-reminder",
          currentTask: {
            ...this.context.currentTask,
            priority,
          },
        },
      };
    }

    if (this.context.state === "adding-task-reminder") {
      const reminder = lowerMessage.includes("yes") || lowerMessage.includes("y");
      const newTask: Task = {
        id: Date.now().toString(),
        title: this.context.currentTask!.title!,
        dueDate: this.context.currentTask!.dueDate!,
        dueTime: this.context.currentTask!.dueTime!,
        priority: this.context.currentTask!.priority!,
        reminder,
        completed: false,
        createdAt: new Date().toISOString(),
      };

      const updatedTasks = [...this.tasks, newTask];
      const summary = `✅ Task created!\n\n📝 ${newTask.title}\n📅 ${newTask.dueDate} at ${newTask.dueTime}\n⚡ Priority: ${newTask.priority}\n🔔 Reminder: ${reminder ? "Yes" : "No"}\n\nAnything else I can help with?`;

      return {
        response: summary,
        newContext: { state: "idle" },
        updatedTasks,
      };
    }

    // Handle task update flow
    if (this.context.state === "updating-task-select") {
      const taskIndex = parseInt(userMessage) - 1;
      if (taskIndex >= 0 && taskIndex < this.tasks.length) {
        const task = this.tasks[taskIndex];
        return {
          response: `What would you like to change?\n\n1. Title\n2. Date/Time\n3. Priority\n4. Reminder\n5. Mark as ${task.completed ? "incomplete" : "complete"}`,
          newContext: {
            state: "updating-task-field",
            selectedTaskId: task.id,
          },
        };
      } else {
        return {
          response: "Invalid selection. Please enter a valid task number.",
          newContext: this.context,
        };
      }
    }

    if (this.context.state === "updating-task-field") {
      const fieldNum = parseInt(userMessage);
      const task = this.tasks.find((t) => t.id === this.context.selectedTaskId);

      if (!task) {
        return {
          response: "Task not found.",
          newContext: { state: "idle" },
        };
      }

      if (fieldNum === 5) {
        const updatedTasks = this.tasks.map((t) =>
          t.id === task.id ? { ...t, completed: !t.completed } : t
        );
        return {
          response: `✅ Task marked as ${!task.completed ? "complete" : "incomplete"}!`,
          newContext: { state: "idle" },
          updatedTasks,
        };
      }

      const fieldMap: Record<number, string> = {
        1: "title",
        2: "date/time",
        3: "priority",
        4: "reminder",
      };

      if (fieldMap[fieldNum]) {
        return {
          response: `What's the new ${fieldMap[fieldNum]}?`,
          newContext: {
            state: "confirming-action",
            selectedTaskId: task.id,
            updateField: fieldMap[fieldNum],
          },
        };
      }

      return {
        response: "Invalid selection. Please enter a number from 1-5.",
        newContext: this.context,
      };
    }

    if (this.context.state === "confirming-action") {
      const task = this.tasks.find((t) => t.id === this.context.selectedTaskId);
      if (!task) {
        return {
          response: "Task not found.",
          newContext: { state: "idle" },
        };
      }

      let updatedTasks = [...this.tasks];
      const field = this.context.updateField!;

      if (field === "title") {
        updatedTasks = this.tasks.map((t) =>
          t.id === task.id ? { ...t, title: userMessage } : t
        );
      } else if (field === "date/time") {
        const { date, time } = this.parseDateTime(userMessage);
        updatedTasks = this.tasks.map((t) =>
          t.id === task.id ? { ...t, dueDate: date, dueTime: time } : t
        );
      } else if (field === "priority") {
        const priority = this.parsePriority(userMessage);
        updatedTasks = this.tasks.map((t) =>
          t.id === task.id ? { ...t, priority } : t
        );
      } else if (field === "reminder") {
        const reminder = lowerMessage.includes("yes") || lowerMessage.includes("y");
        updatedTasks = this.tasks.map((t) =>
          t.id === task.id ? { ...t, reminder } : t
        );
      }

      const updatedTask = updatedTasks.find((t) => t.id === task.id)!;
      return {
        response: `✅ Task updated!\n\n📝 ${updatedTask.title}\n📅 ${updatedTask.dueDate} at ${updatedTask.dueTime}\n⚡ Priority: ${updatedTask.priority}\n🔔 Reminder: ${updatedTask.reminder ? "Yes" : "No"}`,
        newContext: { state: "idle" },
        updatedTasks,
      };
    }

    // Handle task deletion flow
    if (this.context.state === "deleting-task-select") {
      const taskIndex = parseInt(userMessage) - 1;
      if (taskIndex >= 0 && taskIndex < this.tasks.length) {
        const task = this.tasks[taskIndex];
        const updatedTasks = this.tasks.filter((t) => t.id !== task.id);
        return {
          response: `✅ Task deleted: "${task.title}"`,
          newContext: { state: "idle" },
          updatedTasks,
        };
      } else {
        return {
          response: "Invalid selection. Please enter a valid task number.",
          newContext: this.context,
        };
      }
    }

    return {
      response: "I didn't understand that. Can you try again?",
      newContext: this.context,
    };
  }

  private formatTaskList(header: string): string {
    let message = header + "\n\n";
    this.tasks.forEach((task, index) => {
      const status = task.completed ? "✅" : "⏳";
      message += `${index + 1}. ${status} ${task.title}\n   📅 ${task.dueDate} at ${task.dueTime}\n   ⚡ ${task.priority}\n\n`;
    });
    return message.trim();
  }

  private parseDateTime(input: string): { date: string; time: string } {
    const lowerInput = input.toLowerCase();
    let date = "";
    let time = "9:00 AM";

    // Extract time
    const timeMatch = input.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)?/i);
    if (timeMatch) {
      let hour = parseInt(timeMatch[1]);
      const minute = timeMatch[2] || "00";
      const period = timeMatch[3]?.toLowerCase();

      if (period === "pm" && hour !== 12) hour += 12;
      if (period === "am" && hour === 12) hour = 0;

      time = `${hour}:${minute}`;
    }

    // Parse date
    if (lowerInput.includes("today")) {
      date = new Date().toLocaleDateString();
    } else if (lowerInput.includes("tomorrow")) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      date = tomorrow.toLocaleDateString();
    } else {
      // Try to parse as date string
      const dateMatch = input.match(/(\w+\s+\d{1,2}|\d{1,2}\/\d{1,2})/);
      date = dateMatch ? dateMatch[0] : new Date().toLocaleDateString();
    }

    return { date, time };
  }

  private parsePriority(input: string): Priority {
    const lower = input.toLowerCase();
    if (lower.includes("high") || lower.includes("urgent")) return "High";
    if (lower.includes("low")) return "Low";
    return "Medium";
  }
}
