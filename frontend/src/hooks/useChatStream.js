import { useRef, useState } from "react";

import {
  getSessionId,
  getConversationId,
  setConversationId,
} from "../utils/storage";
import { parseSseBuffer } from "../utils/sse";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function useChatStream() {
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);

  const abortController = useRef(null);
  const assistantMessageId = useRef(null);

  const updateAssistantMessage = (callback) => {
    setMessages((previous) =>
      previous.map((message) =>
        message.id === assistantMessageId.current
          ? {
              ...message,
              ...callback(message),
            }
          : message,
      ),
    );
  };

  const handleEvent = (data) => {
    if (data.type === "meta" && data.conversationId) {
      setConversationId(data.conversationId);

      window.dispatchEvent(
        new CustomEvent("conversationCreated", {
          detail: {
            conversationId: data.conversationId,
          },
        }),
      );
    }

    if (data.type === "content") {
      updateAssistantMessage((current) => ({
        content: current.content + (data.text || ""),
      }));
    }

    if (data.type === "complete") {
      updateAssistantMessage(() => ({
        streaming: false,
      }));
    }

    if (data.type === "error") {
      throw new Error(data.message || "AI stream failed");
    }
  };

  const sendMessage = async (message) => {
    if (!message?.trim()) {
      return;
    }

    setError(null);

    const id = crypto.randomUUID();
    assistantMessageId.current = id;

    setMessages((previous) => [
      ...previous,
      {
        role: "user",
        content: message.trim(),
      },
      {
        id,
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
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: message.trim(),
          conversationId: getConversationId() || undefined,
          sessionId: getSessionId(),
        }),
        signal: abortController.current.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`Stream request failed (${response.status})`);
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

        const parsed = parseSseBuffer(buffer);
        buffer = parsed.remainder;

        parsed.events.forEach(handleEvent);
      }
    } catch (streamError) {
      if (streamError.name !== "AbortError") {
        console.error("Stream error:", streamError);
        setError(streamError.message);

        updateAssistantMessage((current) => ({
          content:
            current.content || "Something went wrong. Please try again.",
          streaming: false,
        }));
      }
    } finally {
      updateAssistantMessage(() => ({
        streaming: false,
      }));
      setIsStreaming(false);
      abortController.current = null;
    }
  };

  const stopStreaming = () => {
    abortController.current?.abort();
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
