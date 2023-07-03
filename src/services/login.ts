import axios from "axios"
import { IAuthForm, UserInfo } from "../types/types"
import axiosInstance from "./axiosInstance"


interface loginResponse {
    message:"string";
    user: UserInfo
}


const login = async ({username, password}: IAuthForm) => {
    const res = await axiosInstance.post("/login",{username, password});
    return res.data as loginResponse
}
export default login