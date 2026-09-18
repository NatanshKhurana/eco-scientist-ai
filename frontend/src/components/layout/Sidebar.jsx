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

  const menuRef = useRef(null);

  // ================================
  // Outside click close menu
  // ================================

  useEffect(() => {
    const closeMenu = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuConversationId(null);
      }
    };

    document.addEventListener("mousedown", closeMenu);

    return () => {
      document.removeEventListener("mousedown", closeMenu);
    };
  }, []);

  // ================================
  // Rename
  // ================================

  const startRename = (conversation) => {
    setMenuConversationId(null);

    setEditingConversationId(conversation._id);

    setEditingTitle(conversation.title || "");
  };

  const saveRename = async (id) => {
    const title = editingTitle.trim();

    if (!title) return;

    const success = await renameChat(id, title);

    if (success) {
      setEditingConversationId(null);

      setEditingTitle("");
    }
  };

  // ================================
  // Delete
  // ================================

  const handleDelete = async (conversation) => {
    setMenuConversationId(null);

    const confirmDelete = window.confirm(`Delete "${conversation.title}"?`);

    if (!confirmDelete) return;

    await deleteChat(conversation._id);
  };

  // ================================
  // Open Chat
  // ================================

  const openChat = async (id) => {
    setMenuConversationId(null);

    await selectConversation(id);
  };

  // ================================
  // New Analysis
  // ================================

  const newAnalysis = () => {
    setMenuConversationId(null);

    startNewChat();
  };

  return (
    <aside
      className="
w-72
h-screen
shrink-0
overflow-hidden
border-r
border-gray-200
bg-white
flex
flex-col
"
    >
      {/* Brand */}

      <div
        className="
px-5
py-5
border-b
border-gray-100
flex
items-center
gap-3
shrink-0
"
      >
        <div
          className="
w-10
h-10
rounded-xl
bg-green-100
flex
items-center
justify-center
"
        >
          <Leaf size={22} className="text-green-700" />
        </div>

        <div className="min-w-0">
          <h1
            className="
font-semibold
text-gray-900
text-[15px]
"
          >
            Eco Scientist
          </h1>

          <p
            className="
text-xs
text-gray-500
"
          >
            AI Research Assistant
          </p>
        </div>
      </div>

      {/* New Analysis */}

      <div
        className="
p-4
shrink-0
"
      >
        <button
          onClick={newAnalysis}
          className="
w-full
h-11
rounded-xl
bg-green-600
hover:bg-green-700
text-white
font-medium
flex
items-center
justify-center
gap-2
transition
"
        >
          <Plus size={18} />
          New Analysis
        </button>
      </div>

      {/* History Scroll Only */}

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
text-sm
text-gray-400
"
          >
            No conversations yet
          </p>
        ) : (
          conversations.map((conversation) => {
            const active = activeConversationId === conversation._id;

            const editing = editingConversationId === conversation._id;

            const menu = menuConversationId === conversation._id;

            return (
              <div
                key={conversation._id}
                ref={menu ? menuRef : null}
                className="
relative
mb-1
group
"
              >
                {editing ? (
                  <div
                    className="
flex
gap-2
bg-green-50
rounded-xl
p-2
"
                  >
                    <input
                      autoFocus
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveRename(conversation._id);

                        if (e.key === "Escape") {
                          setEditingConversationId(null);
                        }
                      }}
                      className="
flex-1
h-8
rounded-lg
border
px-2
outline-none
"
                    />

                    <button onClick={() => saveRename(conversation._id)}>
                      <Check size={16} />
                    </button>

                    <button onClick={() => setEditingConversationId(null)}>
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div
                    className={`
flex
items-center
rounded-xl

${active ? "bg-green-50" : "hover:bg-gray-50"}

`}
                  >
                    <button
                      disabled={isStreaming}
                      onClick={() => openChat(conversation._id)}
                      className="
flex-1
flex
items-start
gap-3
px-3
py-3
text-left
min-w-0
"
                    >
                      <MessageSquare
                        size={16}
                        className="
text-gray-400
mt-1
shrink-0
"
                      />

                      <div className="min-w-0">
                        <p
                          className="
text-sm
truncate
text-gray-700
font-medium
"
                        >
                          {conversation.title || "New Conversation"}
                        </p>

                        <p
                          className="
text-[11px]
text-gray-400
"
                        >
                          {new Date(
                            conversation.lastActivityAt ||
                              conversation.createdAt,
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();

                        setMenuConversationId(menu ? null : conversation._id);
                      }}
                      className={`
mr-2
w-8
h-8
rounded-lg
items-center
justify-center

${menu ? "flex" : "hidden group-hover:flex"}

hover:bg-gray-200
`}
                    >
                      <MoreHorizontal size={17} />
                    </button>

                    {menu && (
                      <div
                        className="
absolute
right-2
top-11
z-50
w-36
bg-white
border
rounded-xl
shadow-lg
p-1
"
                      >
                        <button
                          onClick={() => startRename(conversation)}
                          className="
w-full
flex
gap-2
px-3
py-2
text-sm
hover:bg-gray-50
rounded-lg
"
                        >
                          <Pencil size={15} />
                          Rename
                        </button>

                        <button
                          onClick={() => handleDelete(conversation)}
                          className="
w-full
flex
gap-2
px-3
py-2
text-sm
text-red-600
hover:bg-red-50
rounded-lg
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
