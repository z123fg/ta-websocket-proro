import React, { FC, ReactNode, useState } from "react";
import UserContext from "../contexts/userContext";
import { Navigate, useNavigate } from "react-router-dom";
import loginAPI from "../services/login";

import { IAuthForm, UserInfo } from "../types/types";
import signupAPI from "../services/signup";
interface UserProviderProps {
    children: ReactNode;
}
const UserProvider: FC<UserProviderProps> = ({ children }) => {
    const [user, setUser] = useState<UserInfo|null>(null);
    const navigate = useNavigate();

    const login = async (user: IAuthForm) => {
        try {
            const res = await loginAPI(user);
            setUser(res.user);
            navigate("/home");
        } catch (err) {
            console.log("err", err);
        }
    };

    const signup = async (user: IAuthForm) => {
        try {
            await signupAPI(user);
            navigate("/login");
        } catch (err) {
            console.log("err", err);
        }
    };

    const signout = () => {
        setUser(null);
        navigate("/login");
    };
    return <UserContext.Provider value={{ user, login, signup, signout }}>{children}</UserContext.Provider>;
};

export default UserProvider;
