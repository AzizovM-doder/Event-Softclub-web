import axios from "axios";

export const api = axios.create({
  baseURL: "https://6915ff05465a9144626e8679.mockapi.io/api/1v",
  timeout: 15000,
});

export function getErrorMessage(err) {
  if (err?.response?.data) {
    const d = err.response.data;
    if (typeof d === "string") return d;
    if (d?.message) return d.message;
  }
  return err?.message || "Something went wrong";
}
