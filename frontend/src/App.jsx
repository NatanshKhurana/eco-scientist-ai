import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";

import Signup from "./pages/Signup";

import Sidebar from "./components/layout/Sidebar";

import Header from "./components/layout/Header";

import ChatWindow from "./components/chat/ChatWindow";

import ChatInput from "./components/chat/ChatInput";

function MainApp() {
  return (
    <div className="flex h-screen">
      <Sidebar />

      <main className="flex-1 flex flex-col">
        <Header />

        <div className="flex-1 min-h-0">
          <ChatWindow />
        </div>

        <ChatInput />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/signup" element={<Signup />} />

        <Route path="*" element={<MainApp />} />
      </Routes>
    </BrowserRouter>
  );
}
