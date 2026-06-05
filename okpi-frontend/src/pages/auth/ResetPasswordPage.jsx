import { useState } from "react";
import axios from "../../api/axiosInstance";

export default function ResetPasswordPage() {

    const [password, setPassword] = useState("");

    const token = new URLSearchParams(window.location.search).get("token");

    const handleSubmit = async () => {
        await axios.post("/api/v1/auth/reset-password", {
            token,
            newPassword: password,
        });

        alert("Password updated");
    };

    return (
        <div>
            <h2>Reset Password</h2>

            <input
                placeholder="New password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />

            <button onClick={handleSubmit}>
                Reset Password
            </button>
        </div>
    );
}