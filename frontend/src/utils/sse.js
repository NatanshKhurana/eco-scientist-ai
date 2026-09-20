export const parseSseBuffer = (buffer) => {
  const blocks = buffer.split(/\r?\n\r?\n/);
  const remainder = blocks.pop() || "";
  const events = [];

  for (const block of blocks) {
    const payload = block
      .split(/\r?\n/)
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trim())
      .join("");

    if (!payload) {
      continue;
    }

    try {
      events.push(JSON.parse(payload));
    } catch {
      // Ignore malformed upstream events and continue the stream.
    }
  }

  return {
    events,
    remainder,
  };
};
