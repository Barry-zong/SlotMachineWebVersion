import React from 'react';
import SlotMachineScene from './components/SlotMachineScene';

const App: React.FC = () => {
  return (
    <div className="w-full h-screen bg-white relative overflow-hidden">
      {/* UI Overlay */}
      <div className="absolute top-8 left-0 w-full text-center pointer-events-none z-10">
        <h1 className="text-4xl font-light tracking-[0.2em] text-gray-800 uppercase">
          Jackpot
        </h1>
        <p className="text-xs text-gray-400 mt-2 tracking-widest uppercase">
          Click the lever to spin
        </p>
      </div>

      {/* 3D Scene Container */}
      <div className="w-full h-full">
        <SlotMachineScene />
      </div>
    </div>
  );
};

export default App;