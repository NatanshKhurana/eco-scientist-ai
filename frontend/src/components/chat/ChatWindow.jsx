import { useEffect, useRef, useState } from "react";
import MessageBubble from "./MessageBubble";
import { useChat } from "../../context/ChatContext";

export default function ChatWindow() {
  const { messages, isStreaming } = useChat();

  const scrollRef = useRef(null);
  const containerRef = useRef(null);

  const [autoScroll, setAutoScroll] = useState(true);

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
      index = (index + 1) % texts.length;
      setThinking(texts[index]);
    }, 2500);

    return () => clearInterval(timer);
  }, [isStreaming]);

  useEffect(() => {
    if (autoScroll) {
      scrollRef.current?.scrollIntoView({
        behavior: "smooth",
      });
    }
  }, [messages, autoScroll]);

  const handleScroll = () => {
    const el = containerRef.current;

    if (!el) return;

    const bottom = el.scrollHeight - el.scrollTop - el.clientHeight;

    setAutoScroll(bottom < 120);
  };

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="
      h-full
      overflow-y-auto
      bg-white
      px-8
      py-6
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
              text-3xl
              font-semibold
              text-gray-900
              mb-3
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
        <div className="max-w-5xl mx-auto">
          {messages.map((message, index) => (
            <MessageBubble key={index} message={message} />
          ))}

          {isStreaming && (
            <div
              className="
              text-sm
              text-gray-500
              animate-pulse
              mt-3
              "
            >
              {thinking}
            </div>
          )}
        </div>
      )}

      <div ref={scrollRef} />
    </div>
  );
}
