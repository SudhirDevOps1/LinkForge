// 🧩 cn() — server-safe classNames helper
// IMPORTANT: Yeh module "use client" boundary ke BAHAR hai, isliye server
// components bhi isko safely call kar sakte hain. (Next.js 16 client module
// se function call karne par 500 deta hai — analytics page ka wahi bug tha.)
import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
