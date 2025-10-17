import React from "react";

export default function ChatMessage({ message, isOwn, currentUserId, otherParticipantId }) {
  const statusMap = message.statusMap || {};
  let deliveryStatus = null;

  if (isOwn) {
    if (otherParticipantId && statusMap[otherParticipantId]) {
      deliveryStatus = statusMap[otherParticipantId];
    } else {
      const keys = Object.keys(statusMap || {});
      for (const k of keys) {
        if (k !== (message.sender?._id || "")) {
          deliveryStatus = statusMap[k];
          break;
        }
      }
    }
  }

  return (
    <div className={`flex mb-2 ${isOwn ? "justify-end" : "justify-start"}`}>
      <div
        className={`relative max-w-[80%] px-4 py-2 rounded-2xl shadow-md transition-all duration-200 
        ${isOwn
          ? "bg-blue-800 text-white rounded-tr-none"
          : "bg-white text-gray-800 border border-gray-200 rounded-tl-none"
        }`}
      >
        <div className="text-sm whitespace-pre-wrap leading-relaxed">{message.text}</div>

        <div className={`text-[10px] mt-2 flex items-center gap-1 ${isOwn ? "justify-end" : ""}`}>
          <span className={`${isOwn ? "text-blue-200" : "text-gray-400"}`}>
            {new Date(message.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          {isOwn && deliveryStatus && (
            <span className="ml-1 text-[10px] text-blue-200">
              {deliveryStatus === "read"
                ? "Read"
                : deliveryStatus === "delivered"
                ? "Delivered"
                : ""}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
