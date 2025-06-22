import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { PlayerProvider } from './context/PlayerContext.jsx';
import Login from "./pages/Login";
import Home from './pages/Home.jsx';
import Library from './pages/Library.jsx';
import Profile from './pages/Profile.jsx';
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from './components/Navbar';
import MiniPlayer from './components/Miniplayer';
import SearchBar from './components/SearchBar';

function Layout({ children }) {
  const location = useLocation();
  const isLogin = location.pathname === '/';
  const [showSearch, setShowSearch] = useState(false);
  return (
    <>
      {!isLogin && <Navbar onSearchClick={() => setShowSearch(true)} />}
      <SearchBar open={showSearch} onClose={() => setShowSearch(false)} />
      {React.cloneElement(children, { showSearch, setShowSearch })}
      {!isLogin && <MiniPlayer />}
    </>
  );
}

function App() {
  return (
    <PlayerProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route 
              path="/home" 
              element={
                <ProtectedRoute>
                  <Home  />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/library" 
              element={
                <ProtectedRoute>
                  <Library />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </Layout>
      </Router>
    </PlayerProvider>
  );
}

export default App;
