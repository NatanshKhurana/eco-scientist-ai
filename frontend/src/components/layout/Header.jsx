import { useChat } from "../../hooks/useChatContext";

function Header() {
  const { currentConversation } = useChat();

  const title = currentConversation?.title || "Environmental Assistant";

  return (
    <header
      className="
      h-16
      bg-white
      border-b
      border-gray-200
      flex
      items-center
      px-8
      shrink-0
      "
    >
      <div>
        <h2
          className="
          font-semibold
          text-gray-900
          text-base
          "
        >
          {title}
        </h2>

        {currentConversation?.title && (
          <p
            className="
            text-xs
            text-gray-400
            "
          >
            Environmental Assistant
          </p>
        )}
      </div>
    </header>
  );
}

export default Header;
