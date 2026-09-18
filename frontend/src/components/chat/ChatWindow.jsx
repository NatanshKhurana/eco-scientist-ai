import { useEffect, useRef, useState } from "react";

import MessageBubble from "./MessageBubble";

import { useChat } from "../../context/ChatContext";

export default function ChatWindow() {
  const { messages, isStreaming } = useChat();

  const scrollRef = useRef(null);

  const containerRef = useRef(null);

  const [autoScroll, setAutoScroll] = useState(true);

  const [thinking, setThinking] = useState("🌱 Analyzing ecosystem data...");

  // =========================
  // Thinking Animation
  // =========================

  useEffect(() => {
    if (!isStreaming) {
      return;
    }

    const texts = [
      "🌱 Analyzing ecosystem data...",

      "🌱 Studying environmental factors...",

      "🌱 Checking scientific references...",

      "🌱 Preparing recommendations...",
    ];

    let index = 0;

    const timer = setInterval(() => {
      index = (index + 1) % texts.length;

      setThinking(texts[index]);
    }, 2500);

    return () => clearInterval(timer);
  }, [isStreaming]);

  // =========================
  // Smart Scroll
  // =========================

  useEffect(() => {
    if (autoScroll) {
      scrollRef.current?.scrollIntoView({
        behavior: "smooth",
      });
    }
  }, [messages, autoScroll]);

  const handleScroll = () => {
    const element = containerRef.current;

    if (!element) {
      return;
    }

    const bottom =
      element.scrollHeight - element.scrollTop - element.clientHeight;

    setAutoScroll(bottom < 100);
  };

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
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
                text-gray-900
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
        <>
          {messages.map((message, index) => (
            <MessageBubble key={index} message={message} />
          ))}

          {isStreaming && (
            <div
              className="
                mt-2
                text-sm
                text-gray-500
                animate-pulse
                "
            >
              {thinking}
            </div>
          )}
        </>
      )}

      <div ref={scrollRef} />
    </div>
  );
}
