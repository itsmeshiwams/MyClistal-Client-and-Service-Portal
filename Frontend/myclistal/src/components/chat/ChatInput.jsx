// src/components/chat/ChatInput.jsx
import React, { useState } from "react";

export default function ChatInput({ onSend, placeholder }) {
  const [text, setText] = useState("");

  const submit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSend(text.trim());
    setText("");
  };

  return (
    <form onSubmit={submit} className="border-t p-3 bg-white">
      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder || "Type a message..."}
          className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
        <button className="bg-blue-700 text-white px-4 py-2 rounded-md shadow hover:bg-blue-800">Send</button>
      </div>
    </form>
  );
}
