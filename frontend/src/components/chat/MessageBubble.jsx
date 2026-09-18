import ReactMarkdown from "react-markdown";

function MessageBubble({ message }) {
  return (
    <div
      className={`
max-w-3xl
p-4
rounded-2xl
${
  message.role === "user"
    ? "ml-auto bg-green-700 text-white"
    : "bg-white border border-gray-200"
}
`}
    >
      {message.role === "assistant" ? (
        <ReactMarkdown>{message.content}</ReactMarkdown>
      ) : (
        message.content
      )}
    </div>
  );
}

export default MessageBubble;
