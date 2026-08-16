import React, { useState } from "react";
import { loginUser, registerUser } from "../api";

function AuthScreen({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState({ text: "", isError: false });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: "", isError: false });

    try {
      if (isLogin) {
        const data = await loginUser(username, password);
        localStorage.setItem("token", data.token);
        localStorage.setItem("username", data.username);
        onLoginSuccess();
      } else {
        await registerUser(username, password);
        setIsLogin(true);
        setPassword("");
        setMessage({
          text: "Registration successful! Please log in.",
          isError: false,
        });
      }
    } catch (err) {
      setMessage({
        text: err.message || "An error occurred",
        isError: true,
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#E0B17D] flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-[#F6EFE5] p-8 rounded-xl shadow-xl border border-[#CDB494]/40 flex flex-col gap-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <img
            src="/key.png"
            alt="logo key"
            className="w-12 h-12 rounded-lg shadow-sm"
          />
          <h1 className="text-2xl font-bold text-[#7F2F07] tracking-wider italic">
            HabitTracker
          </h1>
          <p className="text-xs text-[#6B5B47] italic">
            {isLogin
              ? "Welcome back! Enter your credentials."
              : "Create an account to start tracking."}
          </p>
        </div>

        {message.text && (
          <div
            className={`p-3 text-xs rounded-lg text-center font-semibold border ${
              message.isError
                ? "bg-red-100 border-red-400 text-red-700"
                : "bg-[#C98928]/15 border-[#C98928] text-[#C98928]"
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold text-[#7F2F07] mb-1">
              Username
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username..."
              className="w-full px-4 py-2 bg-[#251712] border border-[#CDB494]/30 rounded-lg text-sm text-[#F6EFE5] placeholder-[#928464] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#7F2F07] mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password..."
              className="w-full px-4 py-2 bg-[#251712] border border-[#CDB494]/30 rounded-lg text-sm text-[#F6EFE5] placeholder-[#928464] focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="mt-2 py-2.5 bg-[#AB5419] hover:bg-[#7F2F07] text-white font-bold text-sm rounded-lg transition-colors shadow-md"
          >
            {isLogin ? "Login" : "Register"}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-[#CDB494]/30">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setMessage({ text: "", isError: false });
            }}
            className="text-xs text-[#AB5419] hover:underline font-semibold"
          >
            {isLogin
              ? "Need an account? Register here"
              : "Already have an account? Login here"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AuthScreen;
