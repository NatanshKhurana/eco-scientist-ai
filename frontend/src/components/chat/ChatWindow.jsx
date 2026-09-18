import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { useChat } from "../../context/ChatContext";

export default function ChatWindow() {
  const { messages, isStreaming } = useChat();

  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  return (
    <div
      className="
      h-full
      overflow-y-auto
      p-6
      bg-gray-50
      "
    >
      {messages.length === 0 ? (
        <div
          className="
          h-full
          flex
          items-center
          justify-center
          "
        >
          <div className="text-center">
            <h2
              className="
              text-2xl
              font-semibold
              mb-2
              "
            >
              Ask Eco Scientist AI
            </h2>

            <p
              className="
              text-gray-500
              "
            >
              Analyze environment, climate and biodiversity problems
            </p>
          </div>
        </div>
      ) : (
        messages.map((message, index) => (
          <div
            key={index}
            className={`
            mb-5
            flex
            ${message.role === "user" ? "justify-end" : "justify-start"}
            `}
          >
            <div
              className={`
              max-w-3xl
              rounded-2xl
              px-5
              py-4

              ${
                message.role === "user"
                  ? "bg-green-600 text-white"
                  : "bg-white border shadow-sm"
              }

              `}
            >
              {message.role === "assistant" ? (
                <ReactMarkdown>{message.content}</ReactMarkdown>
              ) : (
                message.content
              )}

              {message.streaming && (
                <span
                  className="
                    inline-block
                    ml-2
                    animate-pulse
                    "
                >
                  ▌
                </span>
              )}
            </div>
          </div>
        ))
      )}

      <div ref={bottomRef} />

      {isStreaming && (
        <p
          className="
            text-sm
            text-gray-400
            mt-2
            "
        >
          Eco Scientist is thinking...
        </p>
      )}
    </div>
  );
}
