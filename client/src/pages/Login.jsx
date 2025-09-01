import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import toast from 'react-hot-toast';

const Login = () => {
  const [state, setState] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { axios, setToken } = useAppContext();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = state === 'login' ? '/api/user/login' : '/api/user/register';

    try {
      const { data } = await axios.post(url, { name, email, password });
      if (data.success) {
        setToken(data.token);
        localStorage.setItem('token', data.token);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-gray-900">
      {/* Background floating shapes */}
      <div className="absolute inset-0">
        <div className="w-40 h-40 bg-purple-600 rounded-full opacity-30 animate-bounce-slow absolute top-10 left-10"></div>
        <div className="w-60 h-60 bg-pink-500 rounded-full opacity-20 animate-bounce-slow absolute bottom-20 right-20"></div>
        <div className="w-32 h-32 bg-blue-500 rounded-full opacity-25 animate-bounce-slow absolute top-1/2 left-3/4"></div>
      </div>
      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-full sm:w-[450px] md:w-[500px] lg:w-[550px] bg-gray-800/90 border border-gray-600 rounded-xl shadow-2xl p-6 sm:p-10 text-gray-100 mx-4 backdrop-blur-md"
      >
        <h2 className="text-3xl font-bold text-center mb-6 text-gray-100">
          <span className="text-gray-200">User</span>{' '}
          {state === 'login' ? 'Login' : 'Sign Up'}
        </h2>

        {state === 'register' && (
          <div className="mb-4">
            <label className="block mb-1 text-sm font-medium text-gray-300">
              Name
            </label>
            <input
              type="text"
              placeholder="Type your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400/70 bg-gray-700 text-gray-100 transition"
              required
            />
          </div>
        )}

        <div className="mb-4">
          <label className="block mb-1 text-sm font-medium text-gray-300">
            Email
          </label>
          <input
            type="email"
            placeholder="Type your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400/70 bg-gray-700 text-gray-100 transition"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1 text-sm font-medium text-gray-300">
            Password
          </label>
          <input
            type="password"
            placeholder="Type your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400/70 bg-gray-700 text-gray-100 transition"
            required
          />
        </div>

        <p className="text-sm mb-4 text-center text-gray-300">
          {state === 'register' ? (
            <>
              Already have an account?{' '}
              <span
                onClick={() => setState('login')}
                className="text-gray-100 cursor-pointer font-medium hover:underline"
              >
                Login
              </span>
            </>
          ) : (
            <>
              Create an account?{' '}
              <span
                onClick={() => setState('register')}
                className="text-gray-100 cursor-pointer font-medium hover:underline"
              >
                Sign Up
              </span>
            </>
          )}
        </p>

        <button
          type="submit"
          className="w-full bg-gray-700 hover:bg-gray-600 text-gray-100 py-2 rounded-md transition-all"
        >
          {state === 'login' ? 'Login' : 'Sign Up'}
        </button>
      </form>

      <style>
        {`
          @keyframes bounceSlow {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-20px); }
          }
          .animate-bounce-slow {
            animation: bounceSlow 10s ease-in-out infinite;
          }
        `}
      </style>
    </div>
  );
};

export default Login;
