import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { BACKEND_URL } from "../constants/variable";

const Api: AxiosInstance = axios.create({
  baseURL: BACKEND_URL,
  timeout: 15_000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

Api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await AsyncStorage.getItem("accessToken");

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error("Failed to read access token:", error);
    }

    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// Api.interceptors.response.use(
//   (response) => response,

//   async (error: AxiosError) => {
//     const originalRequest = error.config as InternalAxiosRequestConfig & {
//       _retry?: boolean;
//     };

//     if (
//       error.response?.status === 401 &&
//       !originalRequest?._retry &&
//       !originalRequest?.url?.includes("/auth/refresh")
//     ) {
//       originalRequest._retry = true;

//       try {
//         const response = await Api.post("/auth/refresh");

//         const newAccessToken = response.data?.accessToken;

//         if (newAccessToken) {
//           await AsyncStorage.setItem(
//             "accessToken",
//             newAccessToken
//           );

//           originalRequest.headers.Authorization =
//             `Bearer ${newAccessToken}`;

//           return Api(originalRequest);
//         }
//       } catch (refreshError) {
//         await AsyncStorage.multiRemove([
//           "accessToken",
//           "user",
//         ]);

//         return Promise.reject(refreshError);
//       }
//     }

//     return Promise.reject(error);
//   }
// );

export default Api;
