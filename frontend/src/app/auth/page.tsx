"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Mic, Loader2, ArrowRight, Sparkles } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { api } from "@/lib/api"
import { useAuthStore } from "@/store/authStore"
import { toast } from "sonner"

export default function AuthPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isDemoLoading, setIsDemoLoading] = useState(false)
  const [error, setError] = useState("")
  const [isLogin, setIsLogin] = useState(true)
  const [rememberMe, setRememberMe] = useState(true)

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const { login } = useAuthStore()

  async function handleDemoAccess() {
    setIsDemoLoading(true)
    setError("")

    try {
      // 1. Try dedicated backend demo endpoint
      const res = await api.post<{ access_token: string }>('/auth/demo', {})
      await login(res.access_token, true)
      toast.success("Welcome! Logged in as Demo User.")
      router.push("/chat")
    } catch (err: any) {
      // 2. Fallback to pre-configured test user
      try {
        const fallbackRes = await api.post<{ access_token: string }>('/auth/login', {
          email: "test@gmail.com",
          password: "password123",
          remember_me: true
        })
        await login(fallbackRes.access_token, true)
        toast.success("Welcome! Logged in as Demo User.")
        router.push("/chat")
      } catch (fallbackErr: any) {
        const msg = fallbackErr?.message || err?.message || "Could not log in as Demo User."
        setError(msg)
        toast.error("Demo login failed. Make sure the backend server is running.")
      }
    } finally {
      setIsDemoLoading(false)
    }
  }

  async function handleAuth(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError("")

    const trimmedEmail = email.trim()
    const trimmedPassword = password.trim()

    try {
      if (!isLogin) {
        const trimmedName = name.trim()
        const trimmedConfirm = confirmPassword.trim()

        if (trimmedPassword !== trimmedConfirm) {
          setError("Passwords do not match")
          toast.error("Passwords do not match")
          setIsLoading(false)
          return
        }

        await api.post('/auth/register', { email: trimmedEmail, name: trimmedName, password: trimmedPassword })
        toast.success("Account created successfully!")
      }

      // Automatically login after successful registration or if in login mode
      const loginData = await api.post<{ access_token: string }>('/auth/login', { 
        email: trimmedEmail, 
        password: trimmedPassword,
        remember_me: rememberMe
      })
      
      await login(loginData.access_token, rememberMe)
      toast.success("Welcome back!")
      router.push("/chat")
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.")
      toast.error(err.message || "An unexpected error occurred.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center font-sans relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-neutral-950/40 mix-blend-multiply z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/50 to-transparent z-10" />
        <motion.img 
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          src="/auth-hero.png" 
          alt="Voxa AI Background" 
          className="w-full h-full object-cover mix-blend-screen opacity-50" 
          style={!isLogin ? { transform: 'scaleX(-1)' } : undefined}
        />
        <div className={`absolute w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none z-10 transition-all duration-700 ${isLogin ? 'top-1/4 left-1/4 bg-indigo-600/20' : 'top-0 right-0 bg-purple-600/30'}`} />
        <div className={`absolute w-[600px] h-[600px] rounded-full blur-[150px] pointer-events-none z-10 transition-all duration-700 ${isLogin ? 'bottom-1/4 right-1/4 bg-purple-600/20' : 'bottom-0 left-0 bg-indigo-600/20'}`} />
      </div>

      <div className="w-full max-w-md p-6 z-20 relative">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-neutral-900/60 backdrop-blur-2xl border border-neutral-800/50 p-8 rounded-3xl shadow-2xl"
        >
          <Link href="/" className="flex items-center justify-center gap-3 font-bold text-3xl tracking-tight mb-8 transition-transform hover:opacity-80">
            <div className={`h-10 w-10 rounded-xl bg-gradient-to-tr flex items-center justify-center text-white transition-colors duration-500 ${isLogin ? 'from-indigo-600 to-purple-500 shadow-[0_0_20px_rgba(79,70,229,0.3)]' : 'from-purple-600 to-indigo-500 shadow-[0_0_20px_rgba(147,51,234,0.3)]'}`}>
              <Mic className="h-5 w-5" />
            </div>
            <span className="text-white">Voxa <span className={`font-medium transition-colors duration-500 ${isLogin ? 'text-indigo-400' : 'text-purple-400'}`}>AI</span></span>
          </Link>
          
          <div className="mb-8 text-center overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={isLogin ? 'login' : 'register'}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <h1 className="text-2xl font-bold tracking-tight text-white mb-2">
                  {isLogin ? "Welcome back" : "Create an account"}
                </h1>
                <p className="text-neutral-400 text-sm">
                  {isLogin ? "Enter your credentials to access your workspace." : "Join us to start building the future."}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium flex items-center gap-2 overflow-hidden"
                >
                  <div className="h-1.5 w-1.5 rounded-full bg-red-500 flex-shrink-0" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>
            
            <AnimatePresence>
              {!isLogin && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2 overflow-hidden"
                >
                  <div className="pb-4">
                    <Label htmlFor="name" className="text-neutral-300">Name</Label>
                    <Input 
                      id="name" 
                      name="name"
                      type="text" 
                      placeholder="John Doe" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required={!isLogin} 
                      className={`bg-neutral-950/50 border-neutral-800 h-12 rounded-xl focus-visible:ring-1 text-white placeholder:text-neutral-600 transition-all mt-2 ${!isLogin ? 'focus-visible:ring-purple-500' : 'focus-visible:ring-indigo-500'}`}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-neutral-300">Email address</Label>
              <Input 
                id="email" 
                name="email"
                type="email" 
                placeholder="name@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
                className={`bg-neutral-950/50 border-neutral-800 h-12 rounded-xl focus-visible:ring-1 text-white placeholder:text-neutral-600 transition-all ${isLogin ? 'focus-visible:ring-indigo-500' : 'focus-visible:ring-purple-500'}`}
              />
            </div>
            
            {isLogin ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-neutral-300">Password</Label>
                  <Link href="#" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                    Forgot password?
                  </Link>
                </div>
                <Input 
                  id="password" 
                  name="password"
                  type="password" 
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-neutral-950/50 border-neutral-800 h-12 rounded-xl focus-visible:ring-1 focus-visible:ring-indigo-500 text-white placeholder:text-neutral-600 transition-all"
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-neutral-300">Password</Label>
                  <Input 
                    id="password" 
                    name="password"
                    type="password" 
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-neutral-950/50 border-neutral-800 h-12 rounded-xl focus-visible:ring-1 focus-visible:ring-purple-500 text-white placeholder:text-neutral-600 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-neutral-300">Confirm</Label>
                  <Input 
                    id="confirmPassword" 
                    name="confirmPassword"
                    type="password" 
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="bg-neutral-950/50 border-neutral-800 h-12 rounded-xl focus-visible:ring-1 focus-visible:ring-purple-500 text-white placeholder:text-neutral-600 transition-all"
                  />
                </div>
              </div>
            )}

            <AnimatePresence>
              {isLogin && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center space-x-2 pt-1 pb-2 overflow-hidden"
                >
                  <Checkbox 
                    id="remember" 
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    className="border-neutral-700 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600 rounded" 
                  />
                  <label htmlFor="remember" className="text-sm font-medium leading-none text-neutral-400 peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                    Remember me for 30 days
                  </label>
                </motion.div>
              )}
            </AnimatePresence>
            
            <Button type="submit" className="w-full bg-white hover:bg-neutral-200 text-neutral-950 h-12 rounded-xl font-bold text-base shadow-lg transition-all group relative overflow-hidden mt-2" disabled={isLoading || isDemoLoading}>
              <div className={`absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-[-100%] group-hover:translate-x-[100%] duration-1000 ${isLogin ? 'from-indigo-500/0 via-indigo-500/10 to-indigo-500/0' : 'from-purple-500/0 via-purple-500/10 to-purple-500/0'}`} />
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <span className="flex items-center">
                  {isLogin ? "Sign In" : "Create account"}
                  <ArrowRight className="ml-2 h-4 w-4 opacity-70 group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </Button>
          </form>

          {/* Demo User Instant Access Section */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-neutral-900/90 px-3 text-neutral-400 font-medium tracking-wider">
                Or explore instantly
              </span>
            </div>
          </div>

          <Button
            type="button"
            onClick={handleDemoAccess}
            disabled={isLoading || isDemoLoading}
            className="w-full bg-gradient-to-r from-indigo-500/15 via-purple-500/15 to-indigo-500/15 hover:from-indigo-500/25 hover:via-purple-500/25 hover:to-indigo-500/25 border border-indigo-500/30 hover:border-indigo-400/60 text-white h-12 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 group shadow-lg"
          >
            {isDemoLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
                <span className="text-neutral-300">Setting up demo session...</span>
              </div>
            ) : (
              <>
                <span className="font-semibold text-neutral-100 group-hover:text-white">
                  Continue as Demo User
                </span>
                <ArrowRight className="ml-auto h-4 w-4 text-neutral-400 group-hover:translate-x-1 group-hover:text-white transition-transform" />
              </>
            )}
          </Button>

          {/* Quick Demo Credentials Auto-Fill Pill */}
          <div className="mt-3.5 text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(true)
                setEmail("test@gmail.com")
                setPassword("password123")
                toast.info("Demo credentials filled: test@gmail.com")
              }}
              className="text-xs text-neutral-400 hover:text-indigo-300 transition-colors inline-flex items-center gap-1.5 py-1 px-2.5 rounded-lg hover:bg-neutral-800/50"
            >
              <span>Auto-fill Demo Credentials:</span>
              <span className="px-1.5 py-0.5 rounded bg-neutral-800 text-[11px] text-indigo-300 font-mono border border-neutral-700/60">
                test@gmail.com
              </span>
            </button>
          </div>

          <div className="mt-6 text-center text-sm text-neutral-400 pt-6 border-t border-neutral-800/50">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button 
              type="button" 
              onClick={() => {
                setIsLogin(!isLogin)
                setError("")
              }} 
              className={`font-semibold transition-colors ${isLogin ? 'text-white hover:text-indigo-400' : 'text-white hover:text-purple-400'}`}
            >
              {isLogin ? "Create one now" : "Sign in here"}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
