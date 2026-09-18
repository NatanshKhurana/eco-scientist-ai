import { useState, useRef } from "react";

import { useChat } from "../../context/ChatContext";

export default function ChatInput() {
  const [text, setText] = useState("");

  const inputRef = useRef(null);

  const { sendMessage, isStreaming } = useChat();

  const submit = () => {
    const message = text.trim();

    if (!message || isStreaming) {
      return;
    }

    sendMessage(message);

    setText("");

    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  return (
    <div
      className="
      border-t
      bg-white
      p-4
      shrink-0
      "
    >
      <div
        className="
        flex
        gap-3
        "
      >
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();

              submit();
            }
          }}
          disabled={isStreaming}
          placeholder="
          Ask your environmental question...
          "
          className="
          flex-1
          border
          border-gray-200
          rounded-xl
          px-4
          py-3
          outline-none
          focus:ring-2
          focus:ring-green-200
          disabled:bg-gray-100
          "
        />

        <button
          onClick={submit}
          disabled={isStreaming || !text.trim()}
          className="
          bg-green-700
          text-white
          px-6
          rounded-xl
          disabled:opacity-50
          transition
          "
        >
          {isStreaming ? "Thinking..." : "Send"}
        </button>
      </div>
    </div>
  );
}
