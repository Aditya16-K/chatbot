import React, { useState } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import ChatBox from './components/ChatBox';
import Community from './pages/Community';
import { assets } from './assets/assets';
import './assets/prism.css';
import Loading from './pages/Loading';
import { useAppContext } from './context/AppContext';
import Login from './pages/Login';
import { Toaster } from 'react-hot-toast';

const App = () => {
  const { user, loadingUser } = useAppContext();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { pathname } = useLocation();

  // Show loading page if still fetching user
  if (pathname === '/loading' || loadingUser) return <Loading />;

  return (
    <>
      <Toaster />

      {/* Show Menu Icon only if user is logged in */}
      {user && !isMenuOpen && (
        <img
          src={assets.menu_icon}
          className="fixed top-3 left-3 w-8 h-8 cursor-pointer md:hidden not-dark:invert z-50"
          onClick={() => setIsMenuOpen(true)}
          alt="Menu"
        />
      )}

      {user ? (
        <div className="dark:bg-gradient-to-b from-[#242124] to-[#000000] dark:text-white">
          <div className="flex h-screen w-screen">
            {/* Sidebar */}
            <Sidebar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />

            {/* Main Chat / Pages */}
            <div className="flex-1 overflow-y-auto">
              <Routes>
                <Route path="/" element={<ChatBox />} />
                <Route path="/community" element={<Community />} />
              </Routes>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-b from-[#242124] to-[#000000] flex items-center justify-center h-screen w-screen">
          <Login />
        </div>
      )}
    </>
  );
};

export default App;
