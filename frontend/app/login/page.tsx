"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import apiClient from "@/lib/apiClient";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async () => {
        setError("");
        setLoading(true);

        try {
            const data = await apiClient.auth.login(email, password) as any;

            if (data.token && data.user) {
                localStorage.setItem("token", data.token);
                localStorage.setItem("user", JSON.stringify(data.user));

                const role = data.user.role;
                if (role === "SUPER_ADMIN") router.push("/dashboard/superadmin");
                if (role === "STORE_MANAGER") router.push("/dashboard/store");
                if (role === "SITE_ENGINEER") router.push("/dashboard/site");
            } else {
                setError("Invalid response from server");
            }
        } catch (err: any) {
            setError(err.message || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-screen justify-center items-center bg-gradient-to-br from-blue-500 to-indigo-600">
            <div className="bg-white p-8 rounded-2xl w-96 shadow-2xl">
                <h1 className="text-3xl font-bold mb-2 text-center text-gray-800">Welcome Back</h1>
                <p className="text-gray-500 text-center mb-6">Construction Inventory System</p>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}

                <input
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleLogin()}
                />

                <input
                    type="password"
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleLogin()}
                />

                <button
                    onClick={handleLogin}
                    disabled={loading}
                    className="w-full p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
                >
                    {loading ? "Logging in..." : "Login"}
                </button>

                <p className="text-xs text-gray-400 text-center mt-4">
                    Demo credentials: superadmin@test.com / password
                </p>
            </div>
        </div>
    );
}
