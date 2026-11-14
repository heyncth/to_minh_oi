"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) {
      setError("Email hoặc mật khẩu không đúng. Vui lòng thử lại.");
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="admin-login">
      <div className="card admin-login__card">
        <h1 className="page-title" style={{ fontSize: "calc(22px * var(--font-base))" }}>
          Đăng nhập Tổ trưởng
        </h1>
        <p style={{ fontSize: "var(--meta-size)", color: "var(--muted)", marginBottom: 16 }}>
          Quản lý bảng tin phường
        </p>

        {error && (
          <p className="admin-login__error" role="alert">
            {error}
          </p>
        )}

        <form onSubmit={onSubmit}>
          <div className="admin-login__field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="admin-login__field">
            <label htmlFor="password">Mật khẩu</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn--primary btn--block" disabled={loading}>
            {loading ? "Đang đăng nhập…" : "Đăng nhập"}
          </button>
        </form>

        <p className="admin-login__note">Tài khoản do phường cấp</p>
      </div>
    </div>
  );
}
