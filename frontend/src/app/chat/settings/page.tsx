"use client"

import { useState, useEffect, useRef } from "react"
import { 
  User, Palette, Languages, Bot, Mic, Bell, 
  Trash2, ShieldCheck, FolderOpen, Info, 
  Upload, Check, Loader2, KeyRound, LogOut, HardDrive, HelpCircle, Mail, Globe, Eye, EyeOff
} from "lucide-react"
import { api } from "@/lib/api"
import { useAuthStore } from "@/store/authStore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { useTheme } from "@/components/theme-provider"
import { clearLocalActivities } from "@/lib/activityLogger"

interface UserSettings {
  id: string
  user_id: string
  theme: string
  language: string
  ai_response_style: string
  voice_enabled: boolean
  voice_speed: string
  voice_gender: string
  notifications_enabled: boolean
  auto_save_chat: boolean
  default_upload_folder: string
}

export default function SettingsPage() {
  const { user, logout } = useAuthStore()
  const { setTheme } = useTheme()
  const [activeTab, setActiveTab] = useState("profile")
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Profile Form State
  const [name, setName] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Security Form State
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  // Clear History Modal State
  const [isClearModalOpen, setIsClearModalOpen] = useState(false)
  const [isClearingHistory, setIsClearingHistory] = useState(false)

  // Storage Stats State
  const [totalFilesCount, setTotalFilesCount] = useState(0)
  const [totalStorageBytes, setTotalStorageBytes] = useState(0)

  useEffect(() => {
    fetchSettingsAndStats()
  }, [])

  useEffect(() => {
    if (user) {
      setName(user.name || "")
      setAvatarUrl((user as any).avatar_url || "")
    }
  }, [user])

  const fetchSettingsAndStats = async () => {
    try {
      setIsLoading(true)
      const res = await api.get<UserSettings>("/settings")
      setSettings(res)
      if (res && res.theme) {
        setTheme(res.theme.toLowerCase() as any)
      }

      // Fetch documents to compute storage usage
      const docsRes = await api.get<any[]>("/documents")
      const docs = Array.isArray(docsRes) ? docsRes : (docsRes as any).data || []
      setTotalFilesCount(docs.length)
      const totalBytes = docs.reduce((acc: number, doc: any) => acc + (doc.file_size || 0), 0)
      setTotalStorageBytes(totalBytes)
    } catch (e) {
      // Silently handle errors on load
    } finally {
      setIsLoading(false)
    }
  }

  const updateSettingsField = async (updatedFields: Partial<UserSettings>) => {
    if (!settings) return
    const newSettings = { ...settings, ...updatedFields }
    setSettings(newSettings)

    if (updatedFields.theme) {
      setTheme(updatedFields.theme.toLowerCase() as any)
    }

    try {
      setIsSaving(true)
      await api.put<UserSettings>("/settings", updatedFields)
      toast.success("Settings updated")
    } catch (error) {
      toast.error("Failed to update settings")
      fetchSettingsAndStats() // revert
    } finally {
      setIsSaving(false)
    }
  }

  const handleProfileSave = async () => {
    try {
      setIsSaving(true)
      await api.put("/settings/profile", { name, avatar_url: avatarUrl })
      toast.success("Profile updated successfully")
    } catch (error) {
      toast.error("Failed to update profile")
    } finally {
      setIsSaving(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.includes("image")) {
      toast.error("Please select an image file")
      return
    }

    setIsUploadingAvatar(true)
    const toastId = toast.loading("Uploading profile picture...")

    try {
      const fileData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      const res = await fetch("/api/upload-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          fileData: fileData
        })
      })

      const json = await res.json()
      if (res.ok && json.url) {
        setAvatarUrl(json.url)
        await api.put("/settings/profile", { name, avatar_url: json.url })
        toast.success("Profile picture updated!", { id: toastId })
      } else {
        throw new Error(json.error || "Upload failed")
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to upload avatar", { id: toastId })
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match")
      return
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }

    setIsChangingPassword(true)
    try {
      await api.put("/settings/password", {
        current_password: currentPassword,
        new_password: newPassword
      })
      toast.success("Password changed successfully")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (error: any) {
      toast.error(error?.message || error?.detail || "Current password is incorrect")
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleClearHistory = async () => {
    setIsClearingHistory(true)
    try {
      clearLocalActivities()
      await api.delete("/settings/chat-history")
      try {
        await api.delete("/analytics/activities")
      } catch (e) {}
      toast.success("Chat, search, and activity history cleared successfully")
      setIsClearModalOpen(false)
    } catch (error) {
      toast.error("Failed to clear chat history")
    } finally {
      setIsClearingHistory(false)
    }
  }

  const formatStorage = (bytes: number) => {
    const mb = bytes / (1024 * 1024)
    if (mb < 1024) return `${mb.toFixed(1)} MB`
    return `${(mb / 1024).toFixed(2)} GB`
  }

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "appearance", label: "Appearance & Language", icon: Palette },
    { id: "ai", label: "AI & Voice Settings", icon: Bot },
    { id: "notifications", label: "Notifications & Chat", icon: Bell },
    { id: "security", label: "Privacy & Security", icon: ShieldCheck },
    { id: "files", label: "File Settings & Storage", icon: FolderOpen },
    { id: "about", label: "About & Support", icon: Info },
  ]

  return (
    <div className="flex flex-col min-h-full bg-transparent text-white font-sans relative">
      <main className="flex-1 p-8 pb-20 relative z-10">
        <div className="max-w-6xl mx-auto">

          {/* Header */}
          <div className="flex items-center justify-between mb-8 border-b border-neutral-800 pb-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Settings</h1>
              <p className="text-neutral-400 text-xs mt-0.5">Manage your account, preferences, and AI behavior.</p>
            </div>
            {isSaving && (
              <span className="text-xs text-indigo-400 flex items-center gap-1 font-mono">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

            {/* Navigation Tabs */}
            <div className="lg:col-span-1 space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-semibold rounded-none border text-left transition-all ${
                      isActive 
                        ? "bg-neutral-800 border-neutral-700 text-white shadow-sm" 
                        : "bg-neutral-900/40 border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? "text-indigo-400" : "text-neutral-500"}`} />
                    <span>{tab.label}</span>
                  </button>
                )
              })}

              <div className="pt-4 mt-4 border-t border-neutral-800/80">
                <button
                  type="button"
                  onClick={() => {
                    logout()
                    toast.success("Logged out successfully")
                    window.location.href = "/auth"
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-xs font-semibold rounded-none border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:border-red-500/50 transition-all"
                >
                  <LogOut className="w-4 h-4 text-red-400" />
                  <span>Log Out Account</span>
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="lg:col-span-3 bg-neutral-900/60 border border-neutral-800 rounded-none p-6 backdrop-blur-md min-h-[500px]">

              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-32 text-neutral-400">
                  <Loader2 className="w-8 h-8 animate-spin mb-3 text-indigo-400" />
                  <p className="text-xs">Loading preferences...</p>
                </div>
              ) : (
                <>
                  {/* TAB 1: PROFILE */}
                  {activeTab === "profile" && (
                    <div className="space-y-6">
                      <h2 className="text-lg font-bold text-white border-b border-neutral-800 pb-3">Profile Information</h2>
                      
                      {/* Avatar */}
                      <div className="flex items-center gap-6">
                        <div className="relative w-20 h-20 bg-neutral-950 border border-neutral-800 rounded-none flex items-center justify-center overflow-hidden">
                          {avatarUrl ? (
                            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-8 h-8 text-neutral-500" />
                          )}
                          {isUploadingAvatar && (
                            <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                              <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
                            </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} accept="image/*" className="hidden" />
                          <Button 
                            type="button" 
                            variant="secondary" 
                            onClick={() => fileInputRef.current?.click()} 
                            disabled={isUploadingAvatar}
                            className="bg-neutral-800 hover:bg-neutral-700 text-white rounded-none border border-neutral-700 text-xs h-9 px-4"
                          >
                            <Upload className="w-3.5 h-3.5 mr-2" /> Upload New Picture
                          </Button>
                          <p className="text-[11px] text-neutral-500">JPG, PNG or WEBP. Saved to Cloudinary.</p>
                        </div>
                      </div>

                      {/* Name & Email */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-neutral-300">Full Name</label>
                          <Input 
                            value={name} 
                            onChange={(e) => setName(e.target.value)} 
                            placeholder="Your Name" 
                            className="bg-neutral-950 border-neutral-800 rounded-none text-xs text-white h-10"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-neutral-300">Email Address</label>
                          <Input 
                            value={user?.email || ""} 
                            disabled 
                            className="bg-neutral-950/50 border-neutral-800/80 rounded-none text-xs text-neutral-500 h-10 cursor-not-allowed"
                          />
                        </div>
                      </div>

                      <div className="pt-4 border-t border-neutral-800 flex justify-end">
                        <Button 
                          onClick={handleProfileSave} 
                          disabled={isSaving}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-none text-xs h-9 px-6 font-semibold"
                        >
                          Save Changes
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: APPEARANCE & LANGUAGE */}
                  {activeTab === "appearance" && settings && (
                    <div className="space-y-6">
                      <h2 className="text-lg font-bold text-white border-b border-neutral-800 pb-3">Appearance & Language</h2>

                      {/* Theme */}
                      <div className="space-y-3">
                        <label className="text-xs font-semibold text-neutral-300 block">Theme Preference</label>
                        <div className="grid grid-cols-3 gap-3">
                          {["light", "dark", "system"].map((t) => (
                            <button
                              key={t}
                              onClick={() => updateSettingsField({ theme: t })}
                              className={`p-4 border text-center uppercase text-xs font-mono transition-all rounded-none ${
                                settings.theme === t 
                                  ? "bg-indigo-600/10 border-indigo-500 text-indigo-400 font-bold" 
                                  : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700"
                              }`}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Language */}
                      <div className="space-y-3 pt-4 border-t border-neutral-800">
                        <label className="text-xs font-semibold text-neutral-300 block">Interface Language</label>
                        <div className="grid grid-cols-3 gap-3">
                          {["English", "Hindi", "Punjabi"].map((lang) => (
                            <button
                              key={lang}
                              onClick={() => updateSettingsField({ language: lang })}
                              className={`p-4 border text-center text-xs font-medium transition-all rounded-none ${
                                settings.language === lang 
                                  ? "bg-indigo-600/10 border-indigo-500 text-indigo-400 font-bold" 
                                  : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700"
                              }`}
                            >
                              {lang}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: AI & VOICE */}
                  {activeTab === "ai" && settings && (
                    <div className="space-y-6">
                      <h2 className="text-lg font-bold text-white border-b border-neutral-800 pb-3">AI & Voice Response</h2>

                      {/* Response Style */}
                      <div className="space-y-3">
                        <label className="text-xs font-semibold text-neutral-300 block">AI Response Tone & Style</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {["Professional", "Friendly", "Short", "Detailed"].map((style) => (
                            <button
                              key={style}
                              onClick={() => updateSettingsField({ ai_response_style: style })}
                              className={`p-3 border text-center text-xs font-medium transition-all rounded-none ${
                                settings.ai_response_style === style 
                                  ? "bg-indigo-600/10 border-indigo-500 text-indigo-400 font-bold" 
                                  : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700"
                              }`}
                            >
                              {style}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Voice Settings */}
                      <div className="space-y-4 pt-4 border-t border-neutral-800">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs font-semibold text-neutral-200 block">Voice Output</span>
                            <span className="text-[11px] text-neutral-500">Enable spoken responses across Voice Assistant</span>
                          </div>
                          <button
                            onClick={() => updateSettingsField({ voice_enabled: !settings.voice_enabled })}
                            className={`w-12 h-6 flex items-center p-1 transition-all rounded-none ${
                              settings.voice_enabled ? "bg-indigo-600 justify-end" : "bg-neutral-800 justify-start"
                            }`}
                          >
                            <span className="w-4 h-4 bg-white block" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-neutral-300">Speech Speed</label>
                            <select
                              value={settings.voice_speed}
                              onChange={(e) => updateSettingsField({ voice_speed: e.target.value })}
                              className="w-full bg-neutral-950 border border-neutral-800 text-xs text-white p-2.5 rounded-none focus:outline-none"
                            >
                              <option value="slow">Slow</option>
                              <option value="normal">Normal</option>
                              <option value="fast">Fast</option>
                            </select>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-neutral-300">Voice Gender</label>
                            <select
                              value={settings.voice_gender}
                              onChange={(e) => updateSettingsField({ voice_gender: e.target.value })}
                              className="w-full bg-neutral-950 border border-neutral-800 text-xs text-white p-2.5 rounded-none focus:outline-none"
                            >
                              <option value="Female">Female</option>
                              <option value="Male">Male</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 4: NOTIFICATIONS & CHAT */}
                  {activeTab === "notifications" && settings && (
                    <div className="space-y-6">
                      <h2 className="text-lg font-bold text-white border-b border-neutral-800 pb-3">Notifications & Chat History</h2>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs font-semibold text-neutral-200 block">Notifications</span>
                            <span className="text-[11px] text-neutral-500">Receive system alerts and updates</span>
                          </div>
                          <button
                            onClick={() => updateSettingsField({ notifications_enabled: !settings.notifications_enabled })}
                            className={`w-12 h-6 flex items-center p-1 transition-all rounded-none ${
                              settings.notifications_enabled ? "bg-indigo-600 justify-end" : "bg-neutral-800 justify-start"
                            }`}
                          >
                            <span className="w-4 h-4 bg-white block" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between border-t border-neutral-800/80 pt-4">
                          <div>
                            <span className="text-xs font-semibold text-neutral-200 block">Auto-Save Chat Sessions</span>
                            <span className="text-[11px] text-neutral-500">Automatically persist conversations in History</span>
                          </div>
                          <button
                            onClick={() => updateSettingsField({ auto_save_chat: !settings.auto_save_chat })}
                            className={`w-12 h-6 flex items-center p-1 transition-all rounded-none ${
                              settings.auto_save_chat ? "bg-indigo-600 justify-end" : "bg-neutral-800 justify-start"
                            }`}
                          >
                            <span className="w-4 h-4 bg-white block" />
                          </button>
                        </div>
                      </div>

                      {/* Clear History */}
                      <div className="pt-6 border-t border-neutral-800 space-y-3">
                        <h3 className="text-xs font-semibold text-red-400 uppercase tracking-wider">Danger Zone</h3>
                        <p className="text-xs text-neutral-400">Permanently delete all your chat conversations and message history from Voxa AI.</p>
                        <Button 
                          onClick={() => setIsClearModalOpen(true)} 
                          variant="destructive" 
                          className="bg-red-600/20 border border-red-500/30 text-red-400 hover:bg-red-600 hover:text-white rounded-none text-xs h-9 px-4"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-2" /> Clear All Chat History
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* TAB 5: SECURITY */}
                  {activeTab === "security" && (
                    <div className="space-y-6">
                      <h2 className="text-lg font-bold text-white border-b border-neutral-800 pb-3">Privacy & Security</h2>

                      {/* Change Password Form */}
                      <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                        <h3 className="text-xs font-semibold text-neutral-200">Change Password</h3>
                        
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-neutral-400">Current Password</label>
                          <div className="relative">
                            <Input 
                              type={showCurrentPassword ? "text" : "password"} 
                              value={currentPassword} 
                              onChange={(e) => setCurrentPassword(e.target.value)} 
                              required 
                              className="bg-neutral-950 border-neutral-800 rounded-none text-xs text-white h-10 pr-10"
                            />
                            <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-3 top-3 text-neutral-500 hover:text-white">
                              {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-neutral-400">New Password</label>
                          <div className="relative">
                            <Input 
                              type={showNewPassword ? "text" : "password"} 
                              value={newPassword} 
                              onChange={(e) => setNewPassword(e.target.value)} 
                              required 
                              className="bg-neutral-950 border-neutral-800 rounded-none text-xs text-white h-10 pr-10"
                            />
                            <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-3 text-neutral-500 hover:text-white">
                              {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-neutral-400">Confirm New Password</label>
                          <Input 
                            type="password" 
                            value={confirmPassword} 
                            onChange={(e) => setConfirmPassword(e.target.value)} 
                            required 
                            className="bg-neutral-950 border-neutral-800 rounded-none text-xs text-white h-10"
                          />
                        </div>

                        <Button 
                          type="submit" 
                          disabled={isChangingPassword} 
                          className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-none text-xs h-9 px-6 font-semibold"
                        >
                          {isChangingPassword ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : <KeyRound className="w-3.5 h-3.5 mr-2" />}
                          Update Password
                        </Button>
                      </form>

                      {/* Sessions */}
                      <div className="pt-6 border-t border-neutral-800 space-y-3">
                        <h3 className="text-xs font-semibold text-neutral-200">Active Sessions</h3>
                        <p className="text-xs text-neutral-400">Logout from your account across all active browser windows and devices.</p>
                        <Button 
                          onClick={logout} 
                          variant="outline" 
                          className="border-neutral-700 hover:bg-neutral-800 text-white rounded-none text-xs h-9 px-4"
                        >
                          <LogOut className="w-3.5 h-3.5 mr-2 text-rose-400" /> Logout All Devices
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* TAB 6: FILE SETTINGS */}
                  {activeTab === "files" && settings && (
                    <div className="space-y-6">
                      <h2 className="text-lg font-bold text-white border-b border-neutral-800 pb-3">File Settings & Storage</h2>

                      {/* Default Upload Folder */}
                      <div className="space-y-2 max-w-sm">
                        <label className="text-xs font-semibold text-neutral-300">Default Upload Folder</label>
                        <select
                          value={settings.default_upload_folder}
                          onChange={(e) => updateSettingsField({ default_upload_folder: e.target.value })}
                          className="w-full bg-neutral-950 border border-neutral-800 text-xs text-white p-2.5 rounded-none focus:outline-none"
                        >
                          <option value="General">General / Root</option>
                          <option value="Documents">Doc Analyzer Files</option>
                          <option value="Images">Cloudinary Image Storage</option>
                        </select>
                      </div>

                      {/* Storage Usage Indicator */}
                      <div className="pt-6 border-t border-neutral-800 space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-xs font-semibold text-neutral-200">Cloud Storage Usage</h3>
                            <span className="text-[11px] text-neutral-500">Total files uploaded to Voxa AI database & Cloudinary</span>
                          </div>
                          <span className="text-xs font-mono text-indigo-400 font-bold">
                            {formatStorage(totalStorageBytes)} / 5.0 GB
                          </span>
                        </div>

                        <div className="w-full h-3 bg-neutral-950 border border-neutral-800 overflow-hidden rounded-none">
                          <div 
                            className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-500" 
                            style={{ width: `${Math.min(100, (totalStorageBytes / (5 * 1024 * 1024 * 1024)) * 100 || 2)}%` }} 
                          />
                        </div>

                        <div className="flex justify-between text-[11px] text-neutral-400 font-mono pt-1">
                          <span>Total Uploaded Files: {totalFilesCount}</span>
                          <span>Cloud Provider: Cloudinary</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 7: ABOUT */}
                  {activeTab === "about" && (
                    <div className="space-y-6">
                      <h2 className="text-lg font-bold text-white border-b border-neutral-800 pb-3">About Voxa AI</h2>

                      <div className="bg-neutral-950 border border-neutral-800 p-4 space-y-3 rounded-none">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-neutral-400 font-medium">Application Version</span>
                          <span className="font-mono text-indigo-400 font-semibold">v3.2.0 (Pro Edition)</span>
                        </div>
                        <div className="flex justify-between items-center text-xs pt-2 border-t border-neutral-900">
                          <span className="text-neutral-400 font-medium">Backend Architecture</span>
                          <span className="text-neutral-300">FastAPI + Async SQLAlchemy + PostgreSQL</span>
                        </div>
                        <div className="flex justify-between items-center text-xs pt-2 border-t border-neutral-900">
                          <span className="text-neutral-400 font-medium">Media Storage</span>
                          <span className="text-neutral-300">Cloudinary SDK</span>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-neutral-800 space-y-3">
                        <h3 className="text-xs font-semibold text-neutral-200">Support & Help Center</h3>
                        <div className="flex flex-wrap gap-3">
                          <Button variant="secondary" className="bg-neutral-800 hover:bg-neutral-700 text-white text-xs h-9 rounded-none border border-neutral-700" onClick={() => window.open('https://github.com', '_blank')}>
                            <HelpCircle className="w-3.5 h-3.5 mr-2" /> Documentation
                          </Button>
                          <Button variant="secondary" className="bg-neutral-800 hover:bg-neutral-700 text-white text-xs h-9 rounded-none border border-neutral-700" onClick={() => window.location.href = 'mailto:support@voxa.ai'}>
                            <Mail className="w-3.5 h-3.5 mr-2" /> Contact Support
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                </>
              )}

            </div>
          </div>

          {/* CLEAR HISTORY CONFIRMATION MODAL */}
          {isClearModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-neutral-900 border border-neutral-800 max-w-md w-full p-6 space-y-4 rounded-none shadow-2xl">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Trash2 className="w-5 h-5 text-red-500" /> Clear All Chat History?
                </h3>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  This action will permanently delete all your AI chat sessions, doc analysis conversations, and messages stored in the database. This action cannot be undone.
                </p>
                <div className="flex justify-end gap-3 pt-4 border-t border-neutral-800">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsClearModalOpen(false)} 
                    disabled={isClearingHistory}
                    className="border-neutral-700 hover:bg-neutral-800 text-white text-xs h-9 rounded-none"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleClearHistory} 
                    disabled={isClearingHistory} 
                    className="bg-red-600 hover:bg-red-500 text-white text-xs h-9 rounded-none font-semibold"
                  >
                    {isClearingHistory ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : null}
                    Yes, Clear History
                  </Button>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}
