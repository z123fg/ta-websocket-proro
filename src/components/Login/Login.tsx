import React, { ChangeEvent, KeyboardEvent, useContext, useState } from "react";
import UserContext from "../../contexts/userContext";

const Login = () => {
    const [user, setUser] = useState({ username: "", password: "" });
    const {login} = useContext(UserContext)

    const handleSubmit = () => {
        login(user)
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
            <button onClick={handleSubmit}>login</button>
        </div>
    );
};

export default Login;
