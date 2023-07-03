import axios from "axios"
import { URL } from "../constants/URLs"
const axiosInstance = axios.create({baseURL:URL, timeout:3000});

export default axiosInstance