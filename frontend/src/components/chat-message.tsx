import React from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"
import { Copy, Edit2, RefreshCcw, Mic } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ChatMessageProps {
  role: string
  content: string
  mediaUrl?: string
  onRegenerate?: () => void
  onEdit?: (newContent: string) => void
}

export function ChatMessage({ role, content, mediaUrl, onRegenerate, onEdit }: ChatMessageProps) {
  const isUser = role === "user"

  const handleCopy = () => {
    navigator.clipboard.writeText(content)
  }

  return (
    <div className={`flex flex-col gap-2 ${isUser ? 'items-end' : 'items-start'} group w-full`}>
      {!isUser && (
        <div className="flex items-center gap-2 mb-1">
          <div className="h-7 w-7 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-600/20">
            <Mic className="h-3.5 w-3.5 text-white" />
          </div>
        </div>
      )}
      
      <div className={`
        ${isUser 
          ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-sm px-5 py-3' 
          : 'bg-card text-card-foreground rounded-2xl rounded-tl-sm px-6 py-5 border border-border/50 glass-card w-full max-w-full overflow-hidden'
        } max-w-[85%] text-[15px] leading-relaxed shadow-sm relative
      `}>
        <div className={`whitespace-pre-wrap markdown-content prose dark:prose-invert ${isUser ? 'prose-p:text-white prose-headings:text-white' : ''} max-w-full`}>
          {isUser ? (
            <p>{content}</p>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ node, inline, className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || '')
                  return !inline && match ? (
                    <div className="relative mt-4 mb-4 rounded-md overflow-hidden bg-[#1E1E1E]">
                      <div className="flex items-center justify-between px-4 py-1.5 bg-neutral-800 text-xs text-neutral-400">
                        <span>{match[1]}</span>
                        <button 
                          onClick={() => navigator.clipboard.writeText(String(children).replace(/\n$/, ''))}
                          className="hover:text-white transition-colors flex items-center gap-1"
                        >
                          <Copy className="h-3 w-3" /> Copy
                        </button>
                      </div>
                      <SyntaxHighlighter
                        {...props}
                        style={vscDarkPlus as any}
                        language={match[1]}
                        PreTag="div"
                        className="!m-0 !bg-transparent text-sm"
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    </div>
                  ) : (
                    <code {...props} className="bg-muted px-1.5 py-0.5 rounded-sm font-mono text-sm">
                      {children}
                    </code>
                  )
                }
              }}
            >
              {content}
            </ReactMarkdown>
          )}
        </div>
        
        {mediaUrl && (
          <div className="mt-3 rounded-xl overflow-hidden border border-white/10">
            <img src={mediaUrl} alt="Uploaded media" className="max-w-full h-auto max-h-64 object-cover" />
          </div>
        )}
        
        {/* Actions Menu */}
        <div className={`absolute ${isUser ? '-left-12 top-1/2 -translate-y-1/2' : '-right-12 top-2'} flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity`}>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground" onClick={handleCopy} title="Copy">
            <Copy className="h-4 w-4" />
          </Button>
          {!isUser && onRegenerate && (
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground" onClick={onRegenerate} title="Regenerate">
              <RefreshCcw className="h-4 w-4" />
            </Button>
          )}
          {isUser && onEdit && (
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground" onClick={() => onEdit(content)} title="Edit">
              <Edit2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      
      {isUser && (
        <div className="h-6 w-6 rounded-full bg-fuchsia-600 flex items-center justify-center text-xs font-medium self-end mt-1">
          U
        </div>
      )}
    </div>
  )
}
