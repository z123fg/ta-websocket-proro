import axios from "axios";
import { IAuthForm } from "../types/types";
import axiosInstance from "./axiosInstance";

interface signupResponse {
    message: "string";
    user: { id: string; online: boolean; username: string };
}

const signup = async ({ username, password }: IAuthForm) => {
    const res = await axiosInstance.post("/signup", { username, password });
    return res.data as signupResponse;
};

export default signup;
