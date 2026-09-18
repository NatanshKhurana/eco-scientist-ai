import { useState, useRef } from "react";

import {
  getSessionId,
  getConversationId,
  setConversationId,
} from "../utils/storage";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function useChatStream() {
  const [messages, setMessages] = useState([]);

  const [isStreaming, setIsStreaming] = useState(false);

  const [error, setError] = useState(null);

  const abortController = useRef(null);

  const sendMessage = async (message) => {
    if (!message || !message.trim()) {
      return;
    }

    setError(null);

    const sessionId = getSessionId();

    const conversationId = getConversationId();

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: message.trim(),
      },
      {
        role: "assistant",
        content: "",
        streaming: true,
      },
    ]);

    setIsStreaming(true);

    abortController.current = new AbortController();

    try {
      const response = await fetch(`${API_URL}/api/chat/stream`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          message: message.trim(),

          sessionId,

          conversationId: conversationId || undefined,
        }),

        signal: abortController.current.signal,
      });

      if (!response.ok) {
        throw new Error("Stream request failed");
      }

      const reader = response.body.getReader();

      const decoder = new TextDecoder();

      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, {
          stream: true,
        });

        const events = buffer.split("\n\n");

        buffer = events.pop();

        for (const event of events) {
          if (!event.trim()) continue;

          const dataLine = event
            .split("\n")
            .find((line) => line.startsWith("data:"));

          if (!dataLine) continue;

          const json = dataLine.replace("data:", "").trim();

          if (!json) continue;

          const data = JSON.parse(json);

          // STREAM CONTENT

          if (data.type === "content") {
            setMessages((prev) => {
              const updated = [...prev];

              const last = updated.length - 1;

              if (updated[last]) {
                updated[last] = {
                  ...updated[last],

                  content: updated[last].content + data.text,
                };
              }

              return updated;
            });
          }

          // STREAM COMPLETE

          if (data.type === "complete") {
            if (data.conversationId) {
              setConversationId(data.conversationId);

              // notify sidebar
              window.dispatchEvent(
                new CustomEvent("conversationCreated", {
                  detail: {
                    conversationId: data.conversationId,
                  },
                }),
              );
            }

            setMessages((prev) => {
              const updated = [...prev];

              const last = updated.length - 1;

              if (updated[last]) {
                updated[last] = {
                  ...updated[last],
                  streaming: false,
                };
              }

              return updated;
            });
          }

          // ERROR

          if (data.type === "error") {
            throw new Error(data.message || "Streaming error");
          }
        }
      }
    } catch (err) {
      if (err.name === "AbortError") return;

      console.error("Chat Stream Error:", err);

      setError(err.message);

      setMessages((prev) => {
        const updated = [...prev];

        const last = updated.length - 1;

        if (updated[last]) {
          updated[last] = {
            ...updated[last],

            content: "Something went wrong. Please try again.",

            streaming: false,
          };
        }

        return updated;
      });
    } finally {
      setIsStreaming(false);

      abortController.current = null;
    }
  };

  const stopStreaming = () => {
    if (abortController.current) {
      abortController.current.abort();
    }

    setIsStreaming(false);
  };

  return {
    messages,

    setMessages,

    sendMessage,

    stopStreaming,

    isStreaming,

    error,
  };
}
