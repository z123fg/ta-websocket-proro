import React, { useContext, useState } from "react";
import UserContext from "../../contexts/userContext";

const Signup = () => {
    const [user, setUser] = useState({ username: "", password: "" });
    const { signup } = useContext(UserContext);

    const handleSubmit = () => {
        signup(user);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUser({ ...user, [e.target.name]: e.target.value });
    };
    return (
        <div>
            <input name="username" value={user.username} onChange={handleChange} />
            <input
                name="password"
                value={user.password}
                onChange={handleChange}
            />
            <button onClick={handleSubmit}>signup</button>
        </div>
    );
};

export default Signup;
