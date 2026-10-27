"use client"

import { useState, useEffect, useRef } from "react"
import { FolderOpen, FileText, Image as ImageIcon, File, Download, Loader2, Calendar, HardDrive, UploadCloud, ExternalLink } from "lucide-react"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface Document {
  id: string
  filename: string
  file_size: number | null
  file_type: string | null
  cloudinary_url: string | null
  cloudinary_public_id: string | null
  created_at: string
}

export default function MyFilesPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Image Storage State
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    try {
      setIsLoading(true)
      const res = await api.get<any[]>("/documents")
      const data = Array.isArray(res) ? res : (res as any).data
      if (data && Array.isArray(data)) {
        setDocuments(data)
      }
    } catch (e) {
      // Silently handle fetch errors on mount to prevent Next.js red overlay on backend restart
    } finally {
      setIsLoading(false)
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.includes("image")) {
      toast.error("Please select an image file.")
      return
    }

    setIsUploading(true)
    const toastId = toast.loading("Uploading and storing image...")

    try {
      // 1. Convert file to Base64
      const fileData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      // 2. Upload to Cloudinary via Next.js API route
      const uploadRes = await fetch('/api/upload-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          fileData: fileData
        })
      })

      const uploadJson = await uploadRes.json()

      if (!uploadRes.ok || !uploadJson.success) {
        throw new Error(uploadJson.error || "Failed to upload image")
      }

      const imageUrl = uploadJson.url

      // 3. Save document record in Python backend database
      const saveRes = await api.post<any>("/documents", {
        filename: file.name,
        file_type: file.type || "image/png",
        file_size: file.size,
        cloudinary_url: imageUrl
      })

      const savedDoc = (saveRes && saveRes.data) ? saveRes.data : saveRes

      if (savedDoc && (savedDoc.id || savedDoc.filename)) {
        setDocuments(prev => [savedDoc, ...prev.filter(d => d.id !== savedDoc.id)])
      }

      toast.success("Image stored successfully!", { id: toastId })
      await fetchDocuments()
      
    } catch (error: any) {
      toast.error(error?.message || "Failed to store image.", { id: toastId })
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = "" // Reset input
      }
    }
  }

  const getFileIcon = (fileType: string | null) => {
    if (!fileType) return <File className="h-4 w-4 text-neutral-400" />
    if (fileType.includes("image")) return <ImageIcon className="h-4 w-4 text-fuchsia-400" />
    if (fileType.includes("pdf")) return <FileText className="h-4 w-4 text-red-400" />
    if (fileType.includes("word") || fileType.includes("document")) return <FileText className="h-4 w-4 text-blue-400" />
    return <File className="h-4 w-4 text-neutral-400" />
  }

  const formatSize = (bytes: number | null) => {
    if (!bytes) return "Unknown"
    const kb = bytes / 1024
    if (kb < 1024) return `${kb.toFixed(0)} KB`
    return `${(kb / 1024).toFixed(1)} MB`
  }

  const imageDocs = documents.filter(doc => 
    (doc.file_type && doc.file_type.includes("image")) || 
    (doc.cloudinary_url && (
      doc.cloudinary_url.includes("cloudinary.com") || 
      doc.cloudinary_url.startsWith("data:image") || 
      doc.cloudinary_url.match(/\.(jpeg|jpg|gif|png|webp)/i)
    ))
  )

  return (
    <div className="flex flex-col min-h-full bg-transparent text-white font-sans relative">
      <main className="flex-1 p-8 pb-20 relative z-10">
        <div className="max-w-7xl mx-auto">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 border-b border-neutral-800 pb-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <FolderOpen className="h-5 w-5 text-indigo-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white">
                  My Files & Image Storage
                </h1>
                <p className="text-neutral-400 text-xs mt-0.5">Centralized management for documents and Cloudinary image assets.</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                className="hidden" 
              />
              <Button 
                onClick={handleUploadClick}
                disabled={isUploading}
                className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-none h-10 px-5 text-sm font-semibold transition-all"
              >
                {isUploading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</>
                ) : (
                  <><UploadCloud className="w-4 h-4 mr-2" /> Upload Image</>
                )}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Left Side: All Uploaded Files */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-neutral-200 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-400" /> All Uploaded Files
                </h2>
                <span className="text-xs text-neutral-400 bg-neutral-900 px-2.5 py-0.5 border border-neutral-800 font-mono">
                  {documents.length} Files
                </span>
              </div>

              <div className="bg-neutral-900/60 border border-neutral-800 rounded-none overflow-hidden flex-1 min-h-[400px]">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 text-neutral-400">
                    <Loader2 className="w-6 h-6 animate-spin mb-3 text-indigo-400" />
                    <p className="text-sm">Loading files...</p>
                  </div>
                ) : documents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-neutral-400">
                    <FolderOpen className="w-10 h-10 mb-3 opacity-40 text-indigo-400" />
                    <h3 className="text-base font-medium text-white mb-1">No files uploaded yet</h3>
                    <p className="max-w-xs text-center text-xs">Uploaded files will appear here automatically.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto max-h-[600px]">
                    <table className="w-full text-left text-sm text-neutral-300 relative">
                      <thead className="text-xs text-neutral-400 uppercase bg-neutral-950 border-b border-neutral-800 sticky top-0 z-10">
                        <tr>
                          <th className="px-4 py-3 font-medium">Filename</th>
                          <th className="px-4 py-3 font-medium">Size</th>
                          <th className="px-4 py-3 font-medium">Uploaded</th>
                        </tr>
                      </thead>
                      <tbody>
                        {documents.map((doc) => (
                          <tr key={doc.id} className="border-b border-neutral-800/50 hover:bg-neutral-800/40 transition-colors">
                            <td className="px-4 py-3 font-medium text-white flex items-center gap-3">
                              <div className="p-1.5 bg-neutral-950 border border-neutral-800 shrink-0">
                                {getFileIcon(doc.file_type)}
                              </div>
                              <div className="flex flex-col">
                                <span className="truncate max-w-[150px] sm:max-w-[200px] text-xs font-normal" title={doc.filename}>{doc.filename}</span>
                                {doc.cloudinary_url && (
                                  <span className="text-[10px] text-emerald-400 font-mono">
                                    Cloudinary
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-xs text-neutral-400 font-mono">
                              {formatSize(doc.file_size)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-xs text-neutral-400">
                              {new Date(doc.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Right Side: Image Storage */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-neutral-200 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-emerald-400" /> Image Storage
                </h2>
                <span className="text-xs text-emerald-400 bg-emerald-950/40 px-2.5 py-0.5 border border-emerald-800/40 font-mono">
                  {imageDocs.length} Images
                </span>
              </div>

              <div className="bg-neutral-900/60 border border-neutral-800 rounded-none overflow-hidden p-4 flex-1 min-h-[400px]">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 text-neutral-400">
                    <Loader2 className="w-6 h-6 animate-spin mb-3 text-emerald-400" />
                    <p className="text-sm">Loading images...</p>
                  </div>
                ) : imageDocs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-neutral-400 h-full">
                    <ImageIcon className="w-10 h-10 mb-3 opacity-40 text-emerald-400" />
                    <h3 className="text-base font-medium text-white mb-1">No images stored</h3>
                    <p className="max-w-xs text-center text-xs">Upload images using the button above to store on Cloudinary.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto max-h-[600px] pr-1">
                    {imageDocs.map((img) => (
                      <div key={img.id} className="group bg-neutral-950 border border-neutral-800 rounded-none overflow-hidden hover:border-neutral-700 transition-all duration-200 relative">
                        <div className="aspect-square w-full relative overflow-hidden bg-neutral-950">
                          <img 
                            src={img.cloudinary_url || ""} 
                            alt={img.filename} 
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-2 p-2">
                            <Button size="sm" variant="secondary" className="w-full bg-neutral-800 hover:bg-neutral-700 text-white rounded-none border border-neutral-700 h-7 text-xs" onClick={() => window.open(img.cloudinary_url || "", "_blank")}>
                              <ExternalLink className="w-3 h-3 mr-1" /> Open Link
                            </Button>
                            <Button size="sm" variant="secondary" className="w-full bg-emerald-700 hover:bg-emerald-600 text-white rounded-none border-none h-7 text-xs" onClick={() => {
                              const link = document.createElement('a');
                              link.href = img.cloudinary_url || "";
                              link.download = img.filename;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            }}>
                              <Download className="w-3 h-3 mr-1" /> Download
                            </Button>
                          </div>
                        </div>
                        <div className="p-2 bg-neutral-900 border-t border-neutral-800 text-xs">
                          <p className="font-medium text-neutral-200 truncate text-[11px]" title={img.filename}>{img.filename}</p>
                          <div className="flex items-center justify-between text-[10px] text-neutral-500 mt-0.5">
                            <span className="font-mono">{formatSize(img.file_size)}</span>
                            <span className="text-emerald-400 font-mono text-[9px]">Cloudinary</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  )
}


