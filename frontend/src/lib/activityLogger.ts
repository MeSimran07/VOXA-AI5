import { api } from "@/lib/api"

export interface ActivityPayload {
  action: string
  query?: string
  title?: string
  category?: "Searches" | "AI Chat" | "Voice Assistant" | "AI Tutor" | "Presentations" | "Doc Analyzer" | "AI Notes" | string
  detail?: string
  metadata?: Record<string, any>
}

const LOCAL_STORAGE_KEY = "voxa_local_activities"

export async function recordUserActivity(payload: ActivityPayload) {
  if (!payload.action) return

  const item = {
    id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    action: payload.action,
    query: payload.query,
    title: payload.title || payload.query || payload.action.replace("_", " ").toUpperCase(),
    category: payload.category || (payload.action === "search" ? "Searches" : "Activity"),
    detail: payload.detail || (payload.query ? `Query: "${payload.query}"` : undefined),
    created_at: new Date().toISOString(),
    metadata: payload.metadata || {}
  }

  // 1. Immediately store in localStorage so Demo User or Email User never loses anything
  try {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY)
      const list = stored ? JSON.parse(stored) : []
      // Avoid duplicate consecutive searches
      const isDuplicate = list.length > 0 && 
        list[0].action === item.action && 
        list[0].query?.toLowerCase() === item.query?.toLowerCase() &&
        (Date.now() - new Date(list[0].created_at).getTime() < 5000)

      if (!isDuplicate) {
        list.unshift(item)
        // Keep up to 100 recent local activities
        if (list.length > 100) list.pop()
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list))
        window.dispatchEvent(new Event("voxa_activity_updated"))
      }
    }
  } catch (e) {
    console.error("Failed to store local activity", e)
  }

  // 2. Persist to backend database if token is available
  try {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token")
      if (token) {
        await api.post("/analytics/activity", payload)
      }
    }
  } catch (e) {
    // Gracefully handle network or auth failure
    console.warn("Could not sync activity to backend (stored locally)", e)
  }
}

export function getLocalActivities(): any[] {
  try {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    }
  } catch (e) {
    console.error("Failed to read local activities", e)
  }
  return []
}

export function clearLocalActivities() {
  try {
    if (typeof window !== "undefined") {
      localStorage.removeItem(LOCAL_STORAGE_KEY)
      window.dispatchEvent(new Event("voxa_activity_updated"))
    }
  } catch (e) {}
}
