import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { apiRequest } from "../api/api.js";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const tokenFromUrl = params.get("token");
  const [token, setToken] = useState(tokenFromUrl || localStorage.getItem("resetToken"));
  const [newPassword, setNewPassword] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (tokenFromUrl) {
      localStorage.setItem("resetToken", tokenFromUrl);
      setToken(tokenFromUrl);
    }
  }, [tokenFromUrl]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      setMsg("Invalid or expired reset link.");
      return;
    }

    if (newPassword.trim().length < 6) {
      setMsg("Password must be at least 6 characters long.");
      return;
    }

    try {
      const res = await apiRequest.put("/auth/reset-password", {
        token,
        newPassword,
      });

      if (res.success) {
        localStorage.removeItem("resetToken");
        setMsg(res.message || "Password reset successful!");

        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        setMsg(res.message || "Error resetting password");
      }
    } catch (err) {
      setMsg(err.message || "Error resetting password");
    }
  };

  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white p-6 rounded-lg shadow-md w-80">
          <h2 className="text-xl font-bold mb-4">Reset Password</h2>
          <p className="text-red-500">Invalid or expired reset link.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-md w-80">
        <h2 className="text-xl font-bold mb-4">Reset Password</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="password"
            placeholder="Enter new password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            className="border p-2 rounded"
          />
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Reset
          </button>
        </form>
        {msg && <p className="mt-3 text-sm">{msg}</p>}
      </div>
    </div>
  );
}
