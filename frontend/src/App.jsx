import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { SocketProvider } from './context/SocketContext.jsx';
import CreateRoom from './pages/CreateRoom.jsx';
import JoinRoom from './pages/JoinRoom.jsx';
import Lobby from './pages/Lobby.jsx';
import Game from './pages/Game.jsx';
import Results from './pages/Results.jsx';

export default function App() {
  return (
    <SocketProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/create" replace />} />
        <Route path="/create" element={<CreateRoom />} />
        <Route path="/join/:code" element={<JoinRoom />} />
        <Route path="/join" element={<JoinRoom />} />
        <Route path="/lobby/:code" element={<Lobby />} />
        <Route path="/game/:code" element={<Game />} />
        <Route path="/results/:code" element={<Results />} />
      </Routes>
    </SocketProvider>
  );
}
