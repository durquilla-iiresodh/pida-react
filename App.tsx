import React from 'react';
import { ChatInterface } from './components/ChatInterface';

function App(): React.ReactNode {
  return (
    <div className="min-h-screen bg-gray-100 text-main-blue flex items-center justify-center p-4 font-sans">
      <ChatInterface />
    </div>
  );
}

export default App;