import React, { FC, ReactNode, useRef, useState } from "react";
import UserContext from "../contexts/userContext";
import { Navigate, useNavigate } from "react-router-dom";
import loginAPI from "../services/login";

import { IAuthForm, UserInfo } from "../types/types";
import signupAPI from "../services/signup";
import { createPeerConnection } from "../utils/peerConnection";
interface UserProviderProps {
    children: ReactNode;
}
const UserProvider: FC<UserProviderProps> = ({ children }) => {
    const [user, setUser] = useState<UserInfo>({ userId: null, username: null, token: null });
    const peerConnectionRef = useRef(createPeerConnection());
    const navigate = useNavigate();
    const pc = peerConnectionRef.current;

    const login = async (user: IAuthForm) => {
        try {
            const myOffer = ""; //await pc.createOffer()
            const myAnswer = ""; //await pc.createAnswer()
            const res = await loginAPI({
                ...user,
                ICEOffer: JSON.stringify(myOffer),
                ICEAnswer: JSON.stringify(myAnswer),
            });
            //pc.setLocalDescription
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
        setUser({ username: null, token: null, userId: null });
        navigate("/login");
    };
    return <UserContext.Provider value={{ user, login, signup, signout }}>{children}</UserContext.Provider>;
};

export default UserProvider;
