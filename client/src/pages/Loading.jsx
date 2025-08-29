import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Loading = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timeout = setTimeout(() => {
      navigate('/');
    }, 4000);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="bg-gradient-to-b from-[#531B81] to-[#29184B] flex flex-col items-center justify-center h-screen w-screen text-white">
      {/* Logo / Name */}
      <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-wide">
        chat<span className="text-pink-400">Bot</span>
      </h1>

      {/* Spinner */}
      <div className="relative w-14 h-14 flex items-center justify-center mb-6">
        <div className="w-14 h-14 border-4 border-transparent border-t-white border-l-pink-400 rounded-full animate-spin"></div>
        <div className="absolute w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse"></div>
      </div>

      {/* Loading text with dots */}
      <p className="text-lg flex gap-1">
        Loading
        <span className="animate-bounce">.</span>
        <span className="animate-bounce delay-150">.</span>
        <span className="animate-bounce delay-300">.</span>
      </p>
    </div>
  );
};

export default Loading;
