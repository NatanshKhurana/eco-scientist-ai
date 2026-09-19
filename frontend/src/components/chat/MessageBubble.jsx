import MarkdownRenderer from "./MarkdownRenderer";

export default function MessageBubble({ message }) {
  if (!message) return null;

  const isUser = message.role === "user";

  return (
    <div
      className={`
        w-full
        flex
        mb-8
        ${isUser ? "justify-end" : "justify-start"}
      `}
    >
      {isUser ? (
        <div
          className="
            max-w-[75%]
            bg-green-600
            text-white
            px-5
            py-3
            rounded-2xl
            rounded-br-md
            shadow-sm
            text-[15px]
            leading-7
            break-words
          "
        >
          {message.content}
        </div>
      ) : (
        <div
          className="
            max-w-4xl
            w-full
            text-gray-900
            text-[15px]
            leading-7
            break-words
          "
        >
          <MarkdownRenderer content={message.content || ""} />

          {message.streaming && (
            <span
              className="
                inline-block
                ml-1
                text-green-600
                animate-pulse
                font-bold
              "
            >
              ▌
            </span>
          )}
        </div>
      )}
    </div>
  );
}
