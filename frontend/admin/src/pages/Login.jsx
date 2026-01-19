import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import upper from "../assets/upper.mp4";
import LoginDoodle from "../assets/LoginDoodle.svg";

import useApi from "../components/useApi";
import ApiEndPoint from "../components/ApiEndPoint";
import { useAuth } from "../context/AuthProvider";
import { toast } from "react-toastify";
import { decrypt } from "../utils/webCrypto";
import { Eye, EyeOff } from "lucide-react";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { postDataWithOutToken, loading } = useApi();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Remember Me – Auto-Fill
  useEffect(() => {
    const stored = localStorage.getItem("rememberedLogin");
    if (stored) {
      decrypt(stored)
        .then((data) => {
          setEmail(data.email);
          setPassword(data.password);
        })
        .catch(() => console.warn("Invalid stored data"));
    }
  }, []);

  // Login Submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    setEmailError("");
    setPasswordError("");

    if (!email.trim()) return setEmailError("Email is required");
    if (!password.trim()) return setPasswordError("Password is required");

    const payload = { email, password, role: 0 };
    const res = await postDataWithOutToken(ApiEndPoint.LOGIN, payload);

    if (res.code === 400) {
      toast.error(res.message);
      setEmail("");
      setPassword("");
      return;
    }

    if (res?.body?.token) {
      login(res.body);
      toast.success(res.message);
      setTimeout(() => navigate("/dashboard"), 100);
    }

    localStorage.setItem("token", res.body.token);
    window.dispatchEvent(new Event("storage"));
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      {/* Background Video */}
      <video
        autoPlay
        muted
        loop
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src={upper} type="video/mp4" />
      </video>

      {/* Optional dark overlay (looks more premium) */}
      <div className="absolute inset-0 bg-black/40"></div>

      {/* Content */}
      <div className="relative z-10 flex w-full h-full items-center justify-center px-6">
        {/* LEFT SIDE LOGO */}
        <div className="hidden md:flex w-1/2 items-center justify-center">
          <img
            src={LoginDoodle}
            className="w-[350px] drop-shadow-2xl"
            alt="Logo"
          />
        </div>

        {/* RIGHT SIDE LOGIN BOX */}
        <div
          className="w-full md:w-1/2 max-w-md p-8 rounded-3xl 
        backdrop-blur-xl bg-white/15 border border-white/20 shadow-2xl"
        >
          <h1 className="text-4xl font-bold text-white text-center mb-2">
            Login
          </h1>
          <p className="text-white/70 text-center mb-6">
            Enter your credentials
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-white/30 
                bg-white/20 text-black placeholder-white/60 focus:ring-2 focus:ring-[#24bdf9]"
                placeholder="Email"
              />
              {emailError && (
                <p className="text-sm text-red-300">{emailError}</p>
              )}
            </div>

            {/* Password */}
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 rounded-xl border border-white/30 
                bg-white/20 text-black placeholder-white/60 focus:ring-2 focus:ring-[#24bdf9]"
                placeholder="Password"
              />

              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute top-1/2 right-4 -translate-y-1/2"
              >
                {showPassword ? (
                  <EyeOff size={22} className="text-white" />
                ) : (
                  <Eye size={22} className="text-white" />
                )}
              </button>

              {passwordError && (
                <p className="text-sm text-red-300 mt-1">{passwordError}</p>
              )}
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-white
                bg-gradient-to-r from-[#0B1D3A] via-[#102A56] to-[#1E3A8A]
                hover:opacity-90 transition-all"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
