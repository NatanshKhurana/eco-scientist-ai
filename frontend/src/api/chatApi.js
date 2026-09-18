const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export async function streamChat(payload, onChunk, onComplete) {
  const response = await fetch(
    `${API_URL}/api/chat/stream`,

    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(payload),
    },
  );

  const reader = response.body.getReader();

  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();

    if (done) break;

    const chunk = decoder.decode(value);

    const lines = chunk.split("\n");

    for (const line of lines) {
      if (!line.startsWith("data:")) continue;

      const data = JSON.parse(line.replace("data:", ""));

      if (data.type === "content") {
        onChunk(data.text);
      }

      if (data.type === "complete") {
        onComplete(data);
      }
    }
  }
}
