"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Command } from "cmdk"
import { Search, Settings, MessageSquare, LayoutDashboard, FileText, User } from "lucide-react"
import { recordUserActivity } from "@/lib/activityLogger"

export function CommandPalette() {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const runCommand = React.useCallback((command: () => void) => {
    setOpen(false)
    command()
  }, [])

  const [paletteQuery, setPaletteQuery] = React.useState("")

  const handleSearchSubmit = React.useCallback((q: string) => {
    if (!q.trim()) return
    recordUserActivity({
      action: "search",
      query: q.trim(),
      title: `Search: "${q.trim()}"`,
      category: "Searches",
      detail: `Command Palette query: "${q.trim()}"`
    })
    setOpen(false)
    router.push(`/chat/history?q=${encodeURIComponent(q.trim())}`)
  }, [router])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed left-[50%] top-[20%] z-50 grid w-full max-w-lg translate-x-[-50%] gap-4 border bg-background shadow-lg duration-200 sm:rounded-xl overflow-hidden glass-card">
        <Command className="w-full flex flex-col overflow-hidden" label="Command Menu">
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Command.Input 
              value={paletteQuery}
              onValueChange={setPaletteQuery}
              onKeyDown={(e) => {
                if (e.key === "Enter" && paletteQuery.trim()) {
                  handleSearchSubmit(paletteQuery)
                }
              }}
              className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 border-0 focus:ring-0" 
              placeholder="Type a command or search history (Enter)..." 
            />
          </div>
          <Command.List className="max-h-[300px] overflow-y-auto overflow-x-hidden p-2">
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
              {paletteQuery.trim() ? (
                <button
                  onClick={() => handleSearchSubmit(paletteQuery)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold"
                >
                  Search History for "{paletteQuery}"
                </button>
              ) : (
                "No results found."
              )}
            </Command.Empty>

            {paletteQuery.trim() && (
              <Command.Group heading="Search Action" className="px-2 text-xs font-medium text-muted-foreground py-2">
                <Command.Item 
                  onSelect={() => handleSearchSubmit(paletteQuery)}
                  className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-none bg-indigo-950/40 border border-indigo-500/30 text-white"
                >
                  <Search className="mr-2 h-4 w-4 text-indigo-400" />
                  <span>Search History & Activities for: <strong>"{paletteQuery}"</strong></span>
                </Command.Item>
              </Command.Group>
            )}
            
            <Command.Group heading="Navigation & Tools" className="px-2 text-xs font-medium text-muted-foreground py-2">
              <Command.Item onSelect={() => runCommand(() => router.push("/chat/history"))} className="relative flex cursor-default select-none items-center rounded-sm px-2 py-2 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground hover:bg-accent hover:text-accent-foreground text-foreground">
                <FileText className="mr-2 h-4 w-4" />
                <span>Activity & Search History</span>
              </Command.Item>
              <Command.Item onSelect={() => runCommand(() => router.push("/chat"))} className="relative flex cursor-default select-none items-center rounded-sm px-2 py-2 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground hover:bg-accent hover:text-accent-foreground text-foreground">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                <span>Dashboard</span>
              </Command.Item>
              <Command.Item onSelect={() => runCommand(() => router.push("/chat/ai-chat"))} className="relative flex cursor-default select-none items-center rounded-sm px-2 py-2 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground hover:bg-accent hover:text-accent-foreground text-foreground">
                <MessageSquare className="mr-2 h-4 w-4" />
                <span>New AI Chat</span>
              </Command.Item>
              <Command.Item onSelect={() => runCommand(() => router.push("/chat/voice"))} className="relative flex cursor-default select-none items-center rounded-sm px-2 py-2 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground hover:bg-accent hover:text-accent-foreground text-foreground">
                <Search className="mr-2 h-4 w-4" />
                <span>Voice Assistant</span>
              </Command.Item>
            </Command.Group>
            
            <Command.Separator className="h-px bg-border my-1" />
            
            <Command.Group heading="Settings" className="px-2 text-xs font-medium text-muted-foreground py-2">
              <Command.Item onSelect={() => runCommand(() => router.push("/chat/settings"))} className="relative flex cursor-default select-none items-center rounded-sm px-2 py-2 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground hover:bg-accent hover:text-accent-foreground text-foreground">
                <User className="mr-2 h-4 w-4" />
                <span>Profile Settings</span>
              </Command.Item>
              <Command.Item onSelect={() => runCommand(() => router.push("/chat/settings"))} className="relative flex cursor-default select-none items-center rounded-sm px-2 py-2 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground hover:bg-accent hover:text-accent-foreground text-foreground">
                <Settings className="mr-2 h-4 w-4" />
                <span>Preferences</span>
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  )
}
