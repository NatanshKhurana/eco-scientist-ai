import { useRef, useState } from "react";

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

    const conversationId = getConversationId();

    const sessionId = getSessionId();

    setMessages((previous) => [
      ...previous,

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
      const response = await fetch(
        `${API_URL}/api/chat/stream`,

        {
          method: "POST",

          credentials: "include",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            message: message.trim(),

            conversationId: conversationId || undefined,

            // only guest needs session

            sessionId,
          }),

          signal: abortController.current.signal,
        },
      );

      if (!response.ok) {
        throw new Error("Stream request failed");
      }

      const reader = response.body.getReader();

      const decoder = new TextDecoder();

      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, {
          stream: true,
        });

        const events = buffer.split("\n\n");

        buffer = events.pop();

        for (const event of events) {
          if (!event.trim()) {
            continue;
          }

          const line = event
            .split("\n")
            .find((item) => item.startsWith("data:"));

          if (!line) {
            continue;
          }

          const json = line.replace("data:", "").trim();

          if (!json) {
            continue;
          }

          let data;

          try {
            data = JSON.parse(json);
          } catch {
            continue;
          }

          // =====================
          // Meta
          // =====================

          if (data.type === "meta") {
            if (data.conversationId) {
              setConversationId(data.conversationId);
            }
          }

          // =====================
          // Content
          // =====================

          if (data.type === "content") {
            setMessages((previous) => {
              const updated = [...previous];

              const index = updated.length - 1;

              if (updated[index]) {
                updated[index] = {
                  ...updated[index],

                  content: updated[index].content + (data.text || ""),
                };
              }

              return updated;
            });
          }

          // =====================
          // Complete
          // =====================

          if (data.type === "complete") {
            if (data.conversationId) {
              setConversationId(data.conversationId);

              window.dispatchEvent(
                new CustomEvent(
                  "conversationCreated",

                  {
                    detail: {
                      conversationId: data.conversationId,
                    },
                  },
                ),
              );
            }

            setMessages((previous) => {
              const updated = [...previous];

              const index = updated.length - 1;

              if (updated[index]) {
                updated[index] = {
                  ...updated[index],

                  streaming: false,
                };
              }

              return updated;
            });
          }

          // =====================
          // Error
          // =====================

          if (data.type === "error") {
            throw new Error(data.message || "Streaming error");
          }
        }
      }
    } catch (error) {
      if (error.name === "AbortError") {
        return;
      }

      console.error("Stream error:", error);

      setError(error.message);

      setMessages((previous) => {
        const updated = [...previous];

        const index = updated.length - 1;

        if (updated[index]) {
          updated[index] = {
            ...updated[index],

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
