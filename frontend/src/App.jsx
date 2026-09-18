import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";
import ChatWindow from "./components/chat/ChatWindow";
import ChatInput from "./components/chat/ChatInput";

function App() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Header />

        <div className="flex-1 min-h-0">
          <ChatWindow />
        </div>

        <ChatInput />
      </div>
    </div>
  );
}

export default App;
