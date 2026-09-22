import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./components/Navbar";
import { KnowledgeRecorder } from "./services/knowledgeRecorder";

export default function App() {
  useEffect(() => {
    const recorder = new KnowledgeRecorder();
    recorder.start();
    return () => recorder.stop();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <Outlet />  
    </div>
  );
}
