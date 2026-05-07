"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, Loader2, ArrowRight } from "lucide-react";
import { Input } from "@/frontend/components/ui/input";
import { Button } from "@/frontend/components/ui/button";

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
                // Success
                router.push("/");
            } else {
                // Error
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
        <div className="min-h-screen w-full bg-gradient-to-br from-inexra-navy to-inexra-teal flex items-center justify-center p-4 md:p-8">

            {/* Main Card Container with Fade In */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px]"
            >

                {/* LEFT SIDE: Brand / Logo Area */}
                <div className="w-full md:w-1/2 bg-gray-50 flex flex-col items-center justify-center p-12 lg:p-16 border-b md:border-b-0 md:border-r border-gray-100 relative overflow-hidden">

                    {/* Decorative circle for style */}
                    <div className="absolute top-0 left-0 w-64 h-64 bg-inexra-teal/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-2xl"></div>

                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="relative z-10 mb-6"
                    >
                        {/* Logo displayed as rectangle - no round container */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src="/inexra-logo.jpg"
                            alt="Inexra Research and Analytics"
                            className="w-64 h-auto object-contain"
                        />
                    </motion.div>

                    <div className="text-center space-y-2 z-10">
                        <h2 className="text-2xl font-bold text-inexra-navy">Welcome Back</h2>
                        <p className="text-gray-500 text-sm max-w-xs mx-auto">
                            Secure access to your business analytics and management dashboard.
                        </p>
                    </div>
                </div>

                {/* RIGHT SIDE: Login Form */}
                <div className="w-full md:w-1/2 p-8 sm:p-12 lg:p-16 flex flex-col justify-center bg-white relative">
                    <div className="max-w-sm mx-auto w-full space-y-8">

                        <div className="text-center md:text-left">
                            <h1 className="text-3xl font-bold text-inexra-navy tracking-tight mb-2">LOGIN FORM</h1>
                            <p className="text-gray-400 text-sm">Please enter your credentials to continue.</p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-6">
                            <div className="space-y-4">
                                {/* Email Field helper */}
                                <div className="space-y-2">
                                    <div className="relative group">
                                        <Mail className="absolute left-0 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-inexra-teal transition-colors" />
                                        <input
                                            type="email"
                                            placeholder="Email or Username"
                                            required
                                            className="w-full pl-8 pr-4 py-3 bg-transparent border-b border-gray-300 focus:border-inexra-teal outline-none transition-colors text-inexra-navy placeholder:text-muted-foreground/50"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* Password Field helper */}
                                <div className="space-y-2">
                                    <div className="relative group">
                                        <Lock className="absolute left-0 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-inexra-teal transition-colors" />
                                        <input
                                            type="password"
                                            placeholder="Password"
                                            required
                                            className="w-full pl-8 pr-4 py-3 bg-transparent border-b border-gray-300 focus:border-inexra-teal outline-none transition-colors text-inexra-navy placeholder:text-muted-foreground/50"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Forgot Password Link */}
                            <div className="flex justify-end">
                                <a href="#" className="text-xs font-medium text-gray-500 hover:text-inexra-teal transition-colors">
                                    Forgot Password?
                                </a>
                            </div>

                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full h-12 bg-inexra-navy hover:bg-inexra-teal text-white font-bold text-base tracking-wide rounded-md shadow-lg shadow-inexra-navy/20 hover:shadow-inexra-teal/40 transition-all duration-300 group"
                            >
                                {loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <span className="flex items-center justify-center gap-2">
                                        Sign In <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </span>
                                )}
                            </Button>
                        </form>
                    </div>

                    {/* Footer Text */}
                    <div className="absolute bottom-6 left-0 w-full text-center">
                        <p className="text-[10px] text-gray-300 uppercase tracking-widest">
                            Inexra Research & Analytics © {new Date().getFullYear()}
                        </p>
                    </div>
                </div>

            </motion.div>
        </div>
    );
}
