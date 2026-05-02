import { createSlice } from "@reduxjs/toolkit";

const DEFAULT_THEME = "whatsapp-light";

const getStoredTheme = () => {
  if (typeof window === "undefined") return DEFAULT_THEME;
  return localStorage.getItem("chat-theme") || DEFAULT_THEME;
};

const applyTheme = (nextTheme) => {
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-theme", nextTheme);
  }
};

const initialTheme = getStoredTheme();
applyTheme(initialTheme);

const initialState = {
  theme: initialTheme,
};

const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    setTheme: (state, action) => {
      state.theme = action.payload;
      if (typeof window !== "undefined") {
        localStorage.setItem("chat-theme", action.payload);
      }
      applyTheme(action.payload);
    },
    toggleTheme: (state) => {
      const nextTheme = state.theme === "whatsapp-light" ? "whatsapp-dark" : "whatsapp-light";
      state.theme = nextTheme;
      if (typeof window !== "undefined") {
        localStorage.setItem("chat-theme", nextTheme);
      }
      applyTheme(nextTheme);
    },
  },
});

export const { setTheme, toggleTheme } = themeSlice.actions;
export default themeSlice.reducer;

