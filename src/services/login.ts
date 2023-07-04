import { IAuthForm, UserInfo } from "../types/types"
import axiosInstance from "./axiosInstance"


interface loginResponse {
    message:"string";
    user: UserInfo
}


interface LoginInfo extends IAuthForm{
    ICEOffer: string;
    ICEAnswer: string
}


const login = async ({username, password,ICEOffer, ICEAnswer}: LoginInfo) => {
    const res = await axiosInstance.post("/login",{username, password, ICEOffer, ICEAnswer});
    return res.data as loginResponse
}
export default login