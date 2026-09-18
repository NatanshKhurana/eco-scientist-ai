import { useState } from "react";

export default function AuthForm({
  type = "login",
  onSubmit,
  loading = false,
}) {
  const isLogin = type === "login";

  const [form, setForm] = useState({
    name: "",

    email: "",

    password: "",
  });

  const handleChange = (e) => {
    setForm({
      ...form,

      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    onSubmit(form);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="
      w-full
      max-w-md
      bg-white
      border
      rounded-2xl
      shadow-sm
      p-8
      "
    >
      <h2
        className="
        text-2xl
        font-semibold
        text-gray-900
        mb-6
        text-center
        "
      >
        {isLogin ? "Login" : "Create Account"}
      </h2>

      {!isLogin && (
        <div className="mb-4">
          <label className="text-sm text-gray-600">Name</label>

          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Your name"
            className="
            w-full
            mt-1
            border
            rounded-xl
            px-4
            py-3
            outline-none
            focus:ring-2
            focus:ring-green-200
            "
            required
          />
        </div>
      )}

      <div className="mb-4">
        <label className="text-sm text-gray-600">Email</label>

        <input
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="Email address"
          className="
          w-full
          mt-1
          border
          rounded-xl
          px-4
          py-3
          outline-none
          focus:ring-2
          focus:ring-green-200
          "
          required
        />
      </div>

      <div className="mb-6">
        <label className="text-sm text-gray-600">Password</label>

        <input
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          placeholder="Password"
          className="
          w-full
          mt-1
          border
          rounded-xl
          px-4
          py-3
          outline-none
          focus:ring-2
          focus:ring-green-200
          "
          required
        />
      </div>

      <button
        disabled={loading}
        className="
        w-full
        bg-green-600
        hover:bg-green-700
        text-white
        rounded-xl
        py-3
        font-medium
        disabled:opacity-50
        "
      >
        {loading ? "Please wait..." : isLogin ? "Login" : "Create Account"}
      </button>
    </form>
  );
}
