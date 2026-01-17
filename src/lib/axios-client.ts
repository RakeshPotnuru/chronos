import Axios from "axios";

export const axios = Axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_BASE_URL}/api`,
});

axios.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const message = (error.response?.data?.error ??
      error.message ??
      "Something went wrong") as string;

    return Promise.reject(new Error(message));
  }
);
