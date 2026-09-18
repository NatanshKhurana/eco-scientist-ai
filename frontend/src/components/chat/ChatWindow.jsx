import { useEffect, useRef, useState } from "react";

import MessageBubble from "./MessageBubble";

import { useChat } from "../../context/ChatContext";

export default function ChatWindow() {
  const { messages, isStreaming } = useChat();

  const bottomRef = useRef(null);

  const [thinking, setThinking] = useState("🌱 Analyzing ecosystem data...");

  useEffect(() => {
    if (!isStreaming) return;

    const texts = [
      "🌱 Analyzing ecosystem data...",

      "🌱 Studying environmental factors...",

      "🌱 Checking scientific references...",

      "🌱 Preparing recommendations...",
    ];

    let index = 0;

    const timer = setInterval(() => {
      index++;

      if (index >= texts.length) index = 0;

      setThinking(texts[index]);
    }, 2500);

    return () => clearInterval(timer);
  }, [isStreaming]);

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

            <p className="text-gray-500">
              Analyze environment, climate and biodiversity problems
            </p>
          </div>
        </div>
      ) : (
        <>
          {messages.map((message, index) => (
            <MessageBubble key={index} message={message} />
          ))}

          {isStreaming && (
            <div
              className="
text-sm
text-gray-500
animate-pulse
mt-2
"
            >
              {thinking}
            </div>
          )}
        </>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
