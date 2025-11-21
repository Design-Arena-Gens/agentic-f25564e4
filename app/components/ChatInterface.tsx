"use client";

import { useState, useEffect, useRef } from "react";
import { Message, Task, ConversationContext } from "../types";
import { TaskAssistant } from "../utils/assistant";

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hi! I'm your task assistant. I can help you add, update, delete, and view tasks. What would you like to do?",
      sender: "assistant",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [context, setContext] = useState<ConversationContext>({ state: "idle" });
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load tasks from localStorage
    const savedTasks = localStorage.getItem("tasks");
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    }
  }, []);

  useEffect(() => {
    // Save tasks to localStorage
    if (tasks.length > 0) {
      localStorage.setItem("tasks", JSON.stringify(tasks));
    }
  }, [tasks]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: "user",
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);

    const assistant = new TaskAssistant(tasks, context);
    const result = assistant.processMessage(inputValue);

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      text: result.response,
      sender: "assistant",
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, assistantMessage]);
    setContext(result.newContext);

    if (result.updatedTasks) {
      setTasks(result.updatedTasks);
    }

    setInputValue("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto bg-white shadow-2xl">
      {/* Header */}
      <div className="bg-whatsapp-dark text-white p-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-whatsapp-primary rounded-full flex items-center justify-center font-bold text-xl">
          🤖
        </div>
        <div>
          <h1 className="font-semibold">Task Assistant</h1>
          <p className="text-xs opacity-80">Always here to help</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#e5ddd5]">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[75%] rounded-lg p-3 shadow ${
                message.sender === "user"
                  ? "bg-whatsapp-light"
                  : "bg-white"
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.text}</p>
              <span className="text-xs text-gray-500 mt-1 block">
                {new Date(message.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      <div className="p-2 bg-white border-t flex gap-2 overflow-x-auto">
        <button
          onClick={() => {
            setInputValue("Add task");
            setTimeout(handleSend, 100);
          }}
          className="px-3 py-1 bg-whatsapp-primary text-white text-sm rounded-full whitespace-nowrap hover:bg-whatsapp-dark transition"
        >
          ➕ Add Task
        </button>
        <button
          onClick={() => {
            setInputValue("View tasks");
            setTimeout(handleSend, 100);
          }}
          className="px-3 py-1 bg-gray-200 text-gray-800 text-sm rounded-full whitespace-nowrap hover:bg-gray-300 transition"
        >
          📋 View Tasks
        </button>
        <button
          onClick={() => {
            setInputValue("Update task");
            setTimeout(handleSend, 100);
          }}
          className="px-3 py-1 bg-gray-200 text-gray-800 text-sm rounded-full whitespace-nowrap hover:bg-gray-300 transition"
        >
          ✏️ Update
        </button>
        <button
          onClick={() => {
            setInputValue("Delete task");
            setTimeout(handleSend, 100);
          }}
          className="px-3 py-1 bg-gray-200 text-gray-800 text-sm rounded-full whitespace-nowrap hover:bg-gray-300 transition"
        >
          🗑️ Delete
        </button>
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message..."
          className="flex-1 border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-whatsapp-primary"
        />
        <button
          onClick={handleSend}
          className="bg-whatsapp-primary text-white px-6 py-2 rounded-full font-semibold hover:bg-whatsapp-dark transition disabled:opacity-50"
          disabled={!inputValue.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
}
