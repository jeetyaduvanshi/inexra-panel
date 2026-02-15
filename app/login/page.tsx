"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ email: "", password: "" });

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (res.ok) {
                router.push("/");
            } else {
                alert(data.error || "Login failed");
                setLoading(false);
            }
        } catch (error) {
            console.error("Login error:", error);
            alert("Something went wrong. Please try again.");
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                minHeight: "100vh",
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg, #f5c518 0%, #f5c518 45%, #1a3e72 45%, #1a3e72 100%)",
                fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                padding: "20px",
            }}
        >
            {/* Main Card */}
            <div
                style={{
                    display: "flex",
                    flexDirection: "row",
                    width: "100%",
                    maxWidth: "900px",
                    minHeight: "480px",
                    backgroundColor: "#fff",
                    boxShadow: "0 8px 40px rgba(0,0,0,0.2)",
                    overflow: "hidden",
                }}
            >
                {/* LEFT: Logo Section */}
                <div
                    style={{
                        width: "45%",
                        backgroundColor: "#f0f0f0",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "40px",
                    }}
                >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src="/inexra-logo.jpg"
                        alt="Inexra Research and Analytics"
                        style={{
                            width: "280px",
                            height: "auto",
                            objectFit: "contain",
                        }}
                    />
                    <p
                        style={{
                            marginTop: "16px",
                            fontSize: "13px",
                            color: "#666",
                            fontStyle: "italic",
                            textAlign: "center",
                        }}
                    >
                        !!Research Made Simple!!
                    </p>
                </div>

                {/* RIGHT: Login Form */}
                <div
                    style={{
                        width: "55%",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "50px 40px",
                        backgroundColor: "#fafafa",
                    }}
                >
                    <h1
                        style={{
                            fontSize: "24px",
                            fontWeight: "bold",
                            color: "#1a3e72",
                            marginBottom: "40px",
                            fontStyle: "italic",
                            letterSpacing: "1px",
                        }}
                    >
                        LOGIN FORM
                    </h1>

                    <form onSubmit={handleLogin} style={{ width: "100%", maxWidth: "320px" }}>
                        <div style={{ marginBottom: "20px" }}>
                            <input
                                type="email"
                                placeholder="admin@gmail.com"
                                required
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                style={{
                                    width: "100%",
                                    padding: "12px 16px",
                                    fontSize: "14px",
                                    border: "none",
                                    borderBottom: "1px solid #ccc",
                                    backgroundColor: "#e8f0fe",
                                    outline: "none",
                                    color: "#333",
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: "30px" }}>
                            <input
                                type="password"
                                placeholder="••••••••••"
                                required
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                style={{
                                    width: "100%",
                                    padding: "12px 16px",
                                    fontSize: "14px",
                                    border: "none",
                                    borderBottom: "1px solid #ccc",
                                    backgroundColor: "#e8f0fe",
                                    outline: "none",
                                    color: "#333",
                                }}
                            />
                        </div>

                        <div style={{ display: "flex", justifyContent: "center" }}>
                            <button
                                type="submit"
                                disabled={loading}
                                style={{
                                    padding: "12px 50px",
                                    fontSize: "15px",
                                    fontWeight: "bold",
                                    color: "#fff",
                                    backgroundColor: "#444",
                                    border: "none",
                                    cursor: loading ? "not-allowed" : "pointer",
                                    letterSpacing: "1px",
                                    opacity: loading ? 0.7 : 1,
                                }}
                            >
                                {loading ? "Signing In..." : "Sign In"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
