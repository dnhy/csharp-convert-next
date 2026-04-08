"use client";

import { createStore } from "jotai";

// 全局共享的 Jotai store，确保所有读写一致
export const jotaiStore = createStore();
