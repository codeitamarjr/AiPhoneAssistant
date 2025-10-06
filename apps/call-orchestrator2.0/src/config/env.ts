import dotenv from "dotenv";
dotenv.config();

export const env = {
  WEB_API_BASE_URL: process.env.WEB_API_BASE_URL || "",
  API_TOKEN: process.env.API_TOKEN || "",
  GROUP_ID: Number(process.env.GROUP_ID || 0) || undefined,
};
