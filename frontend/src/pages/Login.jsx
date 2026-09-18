import { useState } from "react";

import { Link, useNavigate } from "react-router-dom";

import AuthForm from "../components/auth/AuthForm";

import { useAuthContext } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuthContext();

  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const handleLogin = async (data) => {
    try {
      setLoading(true);

      setError("");

      await login(data);

      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="
      min-h-screen
      bg-gray-50
      flex
      items-center
      justify-center
      px-4
      "
    >
      <div className="w-full max-w-md">
        {error && (
          <div
            className="
            mb-4
            bg-red-50
            text-red-600
            px-4
            py-3
            rounded-xl
            text-sm
            "
          >
            {error}
          </div>
        )}

        <AuthForm type="login" onSubmit={handleLogin} loading={loading} />

        <p
          className="
          text-center
          text-sm
          text-gray-500
          mt-5
          "
        >
          Don't have account?
          <Link
            to="/signup"
            className="
            text-green-600
            ml-1
            font-medium
            "
          >
            Signup
          </Link>
        </p>
      </div>
    </div>
  );
}
