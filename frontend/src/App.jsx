import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";
import ChatWindow from "./components/chat/ChatWindow";
import ChatInput from "./components/chat/ChatInput";

function App() {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header />

        <div className="flex-1 min-h-0 overflow-hidden">
          <ChatWindow />
        </div>

        <ChatInput />
      </main>
    </div>
  );
}

export default App;
