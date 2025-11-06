import { useState } from 'react';
import MirrorInterface from './components/MirrorInterface';
import { generateMockStyleProfile } from './models';
import './App.css';

function App() {
  const [styleProfile] = useState(() => generateMockStyleProfile());

  const handleSubmit = (input) => {
    console.log('User submitted:', input);
  };

  return (
    <div className="app">
      <MirrorInterface 
        styleProfile={styleProfile}
        conversationHistory={[]}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

export default App;
