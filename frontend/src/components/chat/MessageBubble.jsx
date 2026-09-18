import MarkdownRenderer from "./MarkdownRenderer";

export default function MessageBubble({ message }) {
  const isUser = message.role === "user";

  return (
    <div
      className={`
      flex
      mb-5
      ${isUser ? "justify-end" : "justify-start"}
      `}
    >
      <div
        className={`
        max-w-3xl
        rounded-2xl
        px-5
        py-4
        shadow-sm
        break-words

        ${
          isUser
            ? `
          bg-green-600
          text-white
          `
            : `
          bg-white
          border
          border-gray-200
          text-gray-800
          `
        }

        `}
      >
        {isUser ? (
          <p
            className="
              whitespace-pre-wrap
              leading-7
              "
          >
            {message.content}
          </p>
        ) : (
          <MarkdownRenderer content={message.content || ""} />
        )}

        {message.streaming && (
          <span
            className="
              inline-block
              ml-1
              animate-pulse
              text-green-600
              font-bold
              "
          >
            ▌
          </span>
        )}
      </div>
    </div>
  );
}
