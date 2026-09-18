import { useEffect, useRef, useState } from "react";

import {
  Leaf,
  Plus,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Trash2,
  Check,
  X,
} from "lucide-react";

import { useChat } from "../../context/ChatContext";

export default function Sidebar() {
  const {
    conversations,

    activeConversationId,

    selectConversation,

    startNewChat,

    renameChat,

    deleteChat,

    isStreaming,
  } = useChat();

  const [menuConversationId, setMenuConversationId] = useState(null);

  const [editingConversationId, setEditingConversationId] = useState(null);

  const [editingTitle, setEditingTitle] = useState("");

  // Ref for currently opened 3-dot menu item
  const menuContainerRef = useRef(null);

  // =====================================
  // Close menu on outside click / Escape
  // =====================================

  useEffect(() => {
    if (!menuConversationId) {
      return;
    }

    const handleOutsideClick = (event) => {
      if (
        menuContainerRef.current &&
        !menuContainerRef.current.contains(event.target)
      ) {
        setMenuConversationId(null);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setMenuConversationId(null);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);

      document.removeEventListener("keydown", handleEscape);
    };
  }, [menuConversationId]);

  // =====================================
  // Start Rename
  // =====================================

  const startRename = (conversation) => {
    setMenuConversationId(null);

    setEditingConversationId(conversation._id);

    setEditingTitle(conversation.title || "");
  };

  // =====================================
  // Cancel Rename
  // =====================================

  const cancelRename = () => {
    setEditingConversationId(null);

    setEditingTitle("");
  };

  // =====================================
  // Save Rename
  // =====================================

  const saveRename = async (conversationId) => {
    const title = editingTitle.trim();

    if (!title) {
      return;
    }

    const success = await renameChat(conversationId, title);

    if (success) {
      setEditingConversationId(null);

      setEditingTitle("");
    }
  };

  // =====================================
  // Delete
  // =====================================

  const handleDelete = async (conversation) => {
    setMenuConversationId(null);

    const confirmed = window.confirm(`Delete "${conversation.title}"?`);

    if (!confirmed) {
      return;
    }

    await deleteChat(conversation._id);
  };

  // =====================================
  // Select Conversation
  // =====================================

  const handleSelectConversation = async (conversationId) => {
    setMenuConversationId(null);

    await selectConversation(conversationId);
  };

  // =====================================
  // New Analysis
  // =====================================

  const handleNewAnalysis = () => {
    setMenuConversationId(null);

    startNewChat();
  };

  return (
    <aside
      className="
      w-72
      shrink-0
      h-screen
      border-r
      border-gray-200
      bg-white
      flex
      flex-col
      "
    >
      {/* =====================================
          Brand
      ===================================== */}

      <div
        className="
        px-5
        py-5
        border-b
        border-gray-100
        flex
        items-center
        gap-3
        "
      >
        <div
          className="
          w-10
          h-10
          shrink-0
          rounded-xl
          bg-green-100
          flex
          items-center
          justify-center
          "
        >
          <Leaf
            size={21}
            className="
            text-green-700
            "
          />
        </div>

        <div
          className="
          min-w-0
          "
        >
          <h1
            className="
            font-semibold
            text-[15px]
            text-gray-900
            truncate
            "
          >
            Eco Scientist
          </h1>

          <p
            className="
            text-[11px]
            text-gray-500
            "
          >
            AI Research Assistant
          </p>
        </div>
      </div>

      {/* =====================================
          New Analysis
      ===================================== */}

      <div
        className="
        p-4
        "
      >
        <button
          type="button"
          onClick={handleNewAnalysis}
          className="
          w-full
          h-11
          rounded-xl
          bg-green-600
          hover:bg-green-700
          text-white
          text-sm
          font-medium
          flex
          items-center
          justify-center
          gap-2
          transition-colors
          "
        >
          <Plus size={18} />
          New Analysis
        </button>
      </div>

      {/* =====================================
          Conversation History
      ===================================== */}

      <div
        className="
        flex-1
        min-h-0
        overflow-y-auto
        px-3
        pb-4
        "
      >
        <p
          className="
          px-2
          mb-2
          text-[11px]
          uppercase
          tracking-wide
          text-gray-400
          "
        >
          Recent
        </p>

        {conversations.length === 0 ? (
          <p
            className="
              px-2
              py-3
              text-sm
              text-gray-400
              "
          >
            No conversations yet
          </p>
        ) : (
          conversations.map((conversation) => {
            const isActive = activeConversationId === conversation._id;

            const isEditing = editingConversationId === conversation._id;

            const menuOpen = menuConversationId === conversation._id;

            return (
              <div
                key={conversation._id}
                ref={menuOpen ? menuContainerRef : null}
                className="
                    relative
                    mb-1
                    group
                    "
              >
                {isEditing ? (
                  // =================================
                  // Rename Mode
                  // =================================

                  <div
                    className="
                          flex
                          items-center
                          gap-1
                          rounded-xl
                          bg-green-50
                          px-2
                          py-2
                          "
                  >
                    <input
                      autoFocus
                      value={editingTitle}
                      onChange={(event) => setEditingTitle(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          saveRename(conversation._id);
                        }

                        if (event.key === "Escape") {
                          cancelRename();
                        }
                      }}
                      className="
                            min-w-0
                            flex-1
                            h-8
                            px-2
                            rounded-lg
                            border
                            border-green-200
                            bg-white
                            text-sm
                            outline-none
                            focus:ring-2
                            focus:ring-green-100
                            "
                    />

                    <button
                      type="button"
                      onClick={() => saveRename(conversation._id)}
                      className="
                            w-8
                            h-8
                            rounded-lg
                            flex
                            items-center
                            justify-center
                            text-green-700
                            hover:bg-green-100
                            transition
                            "
                    >
                      <Check size={16} />
                    </button>

                    <button
                      type="button"
                      onClick={cancelRename}
                      className="
                            w-8
                            h-8
                            rounded-lg
                            flex
                            items-center
                            justify-center
                            text-gray-500
                            hover:bg-gray-100
                            transition
                            "
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  // =================================
                  // Normal Conversation Item
                  // =================================

                  <div
                    className={`
                          flex
                          items-center
                          rounded-xl
                          transition-colors

                          ${isActive ? "bg-green-50" : "hover:bg-gray-50"}
                          `}
                  >
                    <button
                      type="button"
                      disabled={isStreaming}
                      onClick={() => handleSelectConversation(conversation._id)}
                      className="
                            min-w-0
                            flex-1
                            flex
                            items-start
                            gap-2.5
                            px-3
                            py-2.5
                            text-left
                            disabled:cursor-not-allowed
                            "
                    >
                      <MessageSquare
                        size={16}
                        className={`
                              mt-0.5
                              shrink-0

                              ${isActive ? "text-green-700" : "text-gray-400"}
                              `}
                      />

                      <div
                        className="
                              min-w-0
                              flex-1
                              "
                      >
                        <p
                          className={`
                                truncate
                                text-sm

                                ${
                                  isActive
                                    ? "font-medium text-gray-900"
                                    : "text-gray-700"
                                }
                                `}
                        >
                          {conversation.title || "New Conversation"}
                        </p>

                        <p
                          className="
                                mt-0.5
                                text-[11px]
                                text-gray-400
                                "
                        >
                          {new Date(
                            conversation.lastActivityAt ||
                              conversation.updatedAt ||
                              conversation.createdAt,
                          ).toLocaleDateString(undefined, {
                            day: "2-digit",

                            month: "short",
                          })}
                        </p>
                      </div>
                    </button>

                    {/* Three dots */}

                    <button
                      type="button"
                      aria-label="
                            Conversation options
                            "
                      onClick={(event) => {
                        event.stopPropagation();

                        setMenuConversationId(
                          menuOpen ? null : conversation._id,
                        );
                      }}
                      className={`
                            mr-1
                            w-8
                            h-8
                            rounded-lg
                            items-center
                            justify-center
                            text-gray-500
                            hover:bg-gray-200
                            transition

                            ${menuOpen ? "flex" : "hidden group-hover:flex"}
                            `}
                    >
                      <MoreHorizontal size={17} />
                    </button>

                    {/* Dropdown */}

                    {menuOpen && (
                      <div
                        className="
                                absolute
                                right-2
                                top-10
                                z-30
                                w-36
                                rounded-xl
                                border
                                border-gray-200
                                bg-white
                                p-1
                                shadow-lg
                                "
                      >
                        <button
                          type="button"
                          onClick={() => startRename(conversation)}
                          className="
                                  w-full
                                  flex
                                  items-center
                                  gap-2
                                  rounded-lg
                                  px-3
                                  py-2
                                  text-sm
                                  text-gray-700
                                  hover:bg-gray-50
                                  transition
                                  "
                        >
                          <Pencil size={15} />
                          Rename
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(conversation)}
                          className="
                                  w-full
                                  flex
                                  items-center
                                  gap-2
                                  rounded-lg
                                  px-3
                                  py-2
                                  text-sm
                                  text-red-600
                                  hover:bg-red-50
                                  transition
                                  "
                        >
                          <Trash2 size={15} />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
