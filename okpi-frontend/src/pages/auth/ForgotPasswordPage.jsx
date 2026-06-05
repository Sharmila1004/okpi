import { useState } from "react";
import axios from "../../api/axiosInstance.js";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");

    const handleSubmit = async () => {
        await axios.post("/api/v1/auth/forgot-password", { email });
        alert("Check your email");
    };

    return (
        <div>
            <h2>Forgot Password</h2>

            <input
                placeholder="Enter email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />

            <button onClick={handleSubmit}>
                Send Reset Link
            </button>
        </div>
    );
}