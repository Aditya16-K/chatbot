import React, { useEffect, useRef, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { assets } from '../assets/assets';
import Message from './Message';
import toast from 'react-hot-toast';

const ChatBox = () => {
  const { selectedChat, theme, user, axios, token, setUser } = useAppContext();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [mode, setMode] = useState('text');
  const [isPublished, setIsPublished] = useState(false);

  const containerRef = useRef(null);

  useEffect(() => {
    if (selectedChat) {
      setMessages(selectedChat.messages);
    }
  }, [selectedChat]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!user) return toast('Login to send message');

    try {
      setLoading(true);

      const promptCopy = prompt;
      setPrompt('');

      // Add user message locally
      setMessages((prev) => [
        ...prev,
        {
          role: 'user',
          content: prompt,
          timestamp: Date.now(),
          isImage: false,
        },
      ]);

      const { data } = await axios.post(
        `/api/message/${mode}`,
        { chatId: selectedChat._id, prompt, isPublished },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        setMessages((prev) => [...prev, data.reply]);
        // Decrease credits
        if (mode === 'image') {
          setUser((prev) => ({ ...prev, credits: prev.credits - 2 }));
        } else {
          setUser((prev) => ({ ...prev, credits: prev.credits - 1 }));
        }
      } else {
        toast.error(data.message);
        setPrompt(promptCopy);
      }
    } catch (error) {
      toast.error(error.message);
      setPrompt(prompt);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Messages Scrollable Area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-5 md:p-10 space-y-2 scrollbar-hide"
      >
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center gap-2 text-primary">
            <img
              src={theme === 'dark' ? assets.logo_full : assets.logo_full_dark}
              alt="Logo"
              className="w-full max-w-56 sm:max-w-68"
            />
            <p className="mt-5 text-4xl sm:text-6xl text-center text-gray-400 dark:text-white">
              Ask me anything.
            </p>
          </div>
        )}

        {messages.map((message, index) => (
          <Message key={index} message={message} />
        ))}

        {loading && (
          <div className="loader flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-gray-500 dark:bg-white animate-bounce"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-gray-500 dark:bg-white animate-bounce"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-gray-500 dark:bg-white animate-bounce"></div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="flex flex-col p-4 border-t border-gray-300 dark:border-gray-700 bg-white dark:bg-[#242124]">
        {mode === 'image' && (
          <label className="inline-flex items-center gap-2 mb-2 text-sm mx-auto">
            <p className="text-xs">Publish Generated Image To Community</p>
            <input
              type="checkbox"
              className="cursor-pointer"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
            />
          </label>
        )}

        <form
          onSubmit={onSubmit}
          className="flex gap-4 items-center w-full max-w-2xl mx-auto"
        >
          <select
            onChange={(e) => setMode(e.target.value)}
            value={mode}
            className="text-sm pl-3 pr-2 outline-none rounded-md border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-[#1C1B1F]"
          >
            <option className="dark:bg-purple-900" value="text">
              Text
            </option>
            <option className="dark:bg-purple-900" value="image">
              Image
            </option>
          </select>

          <input
            onChange={(e) => setPrompt(e.target.value)}
            value={prompt}
            type="text"
            placeholder="Type your prompt here..."
            className="flex-1 p-2 rounded-md border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-[#1C1B1F] text-black dark:text-white outline-none"
            required
          />

          <button disabled={loading} type="submit">
            <img
              src={loading ? assets.stop_icon : assets.send_icon}
              alt="Send"
              className="w-8 cursor-pointer"
            />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatBox;
