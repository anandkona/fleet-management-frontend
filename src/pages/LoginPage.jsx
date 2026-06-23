import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState("");

  const handleLogin = async (identifier, password) => {
    setError("");
    try {
      await login(identifier, password);
      navigate("/dashboard");
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Invalid credentials";
      setError(msg);
      throw new Error(msg);
    }
  };

  return <AuthLayout onLogin={handleLogin} error={error} setError={setError} />;
}
