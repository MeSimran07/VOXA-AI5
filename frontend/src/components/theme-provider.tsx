"use client"

import React, { createContext, useContext, useEffect, useState } from "react"

type Theme = "dark" | "light" | "system"

interface ThemeProviderContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeProviderContext = createContext<ThemeProviderContextType>({
  theme: "dark",
  setTheme: () => null,
})

export function ThemeProvider({
  children,
  defaultTheme = "dark",
  storageKey = "voxa-theme",
}: {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
  attribute?: string
  enableSystem?: boolean
}) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme)

  useEffect(() => {
    const savedTheme = (localStorage.getItem(storageKey) as Theme) || defaultTheme
    setThemeState(savedTheme)
    applyTheme(savedTheme)
  }, [])

  const applyTheme = (t: Theme) => {
    if (typeof window === "undefined") return
    const root = document.documentElement
    root.classList.remove("light", "dark")

    if (t === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
      root.classList.add(systemTheme)
    } else {
      root.classList.add(t)
    }
  }

  const setTheme = (t: Theme) => {
    localStorage.setItem(storageKey, t)
    setThemeState(t)
    applyTheme(t)
  }

  return (
    <ThemeProviderContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeProviderContext)
