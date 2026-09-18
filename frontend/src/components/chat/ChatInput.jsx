import { useState } from "react";
import { useChat } from "../../context/ChatContext";

function ChatInput() {
  const [text, setText] = useState("");

  const { sendMessage, isStreaming } = useChat();

  const submit = () => {
    if (!text.trim()) return;

    sendMessage(text.trim());

    setText("");
  };

  return (
    <div
      className="
      border-t
      bg-white
      p-5
      "
    >
      <div
        className="
        flex
        gap-3
        "
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !isStreaming) {
              submit();
            }
          }}
          placeholder="Ask your environmental question..."
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
          "
        />

        <button
          onClick={submit}
          disabled={isStreaming}
          className="
          bg-green-700
          text-white
          px-6
          rounded-xl
          disabled:opacity-50
          "
        >
          {isStreaming ? "Thinking..." : "Send"}
        </button>
      </div>
    </div>
  );
}

export default ChatInput;
