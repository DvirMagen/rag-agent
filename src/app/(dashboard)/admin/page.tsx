'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Trash2, Upload, FileText, Settings, Plus, Link, CheckCircle2 } from 'lucide-react'
import { Document, AgentConfig } from '@/types'

export default function AdminPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [config, setConfig] = useState<AgentConfig | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [savingConfig, setSavingConfig] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [activeTab, setActiveTab] = useState<'upload' | 'documents' | 'settings'>('upload')
  const supabase = createClient()

  useEffect(() => {
    fetchDocuments()
    fetchConfig()
  }, [])

  const fetchDocuments = async () => {
    const res = await fetch('/api/documents')
    const data = await res.json()
    setDocuments(data)
  }

  const fetchConfig = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('agent_configs')
      .select('*')
      .eq('user_id', user.id)
      .single()
    if (data) {
      setConfig(data)
    } else {
      const { data: newConfig } = await supabase
        .from('agent_configs')
        .insert({ user_id: user.id })
        .select()
        .single()
      setConfig(newConfig)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingFile(true)
    setMessage(null)

    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })

    const data = await res.json()

    if (res.ok) {
      setMessage({ text: `"${file.name}" uploaded successfully! Created ${data.chunksCount} chunks.`, type: 'success' })
      fetchDocuments()
    } else {
      setMessage({ text: data.error, type: 'error' })
    }

    setUploadingFile(false)
    e.target.value = ''
  }

  const handleUpload = async () => {
    if (!title || !content) return
    setUploading(true)
    setMessage(null)

    const res = await fetch('/api/ingest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content, source_url: sourceUrl }),
    })

    const data = await res.json()

    if (res.ok) {
      setMessage({ text: `Successfully created ${data.chunksCount} chunks`, type: 'success' })
      setTitle('')
      setContent('')
      setSourceUrl('')
      fetchDocuments()
    } else {
      setMessage({ text: data.error, type: 'error' })
    }

    setUploading(false)
  }

  const handleDelete = async (id: string) => {
    await fetch('/api/documents', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    fetchDocuments()
  }

  const handleSaveConfig = async () => {
    if (!config) return
    setSavingConfig(true)
    await supabase.from('agent_configs').upsert({ ...config })
    setSavingConfig(false)
    setMessage({ text: 'Settings saved successfully', type: 'success' })
    setTimeout(() => setMessage(null), 3000)
  }

  const tabs = [
    { id: 'upload', label: 'Upload', icon: Plus },
    { id: 'documents', label: 'Documents', icon: FileText, count: documents.length },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  return (
    <div className="max-w-4xl mx-auto px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">Admin Panel</h1>
        <p className="text-muted-foreground mt-1">Manage your knowledge base and agent settings</p>
      </div>

      {message && (
        <div className={`flex items-center gap-2 p-3 rounded-xl mb-6 text-sm ${
          message.type === 'success'
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted rounded-xl mb-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {'count' in tab && (
              <Badge variant="secondary" className="text-xs h-5 px-1.5">
                {tab.count}
              </Badge>
            )}
          </button>
        ))}
      </div>

      {/* Upload Tab */}
      {activeTab === 'upload' && (
        <div className="space-y-4">
          {/* File Upload */}
          <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-muted/30">
            <div className="flex-1">
              <p className="text-sm font-medium">Upload a file</p>
              <p className="text-xs text-muted-foreground mt-0.5">Supports PDF, TXT, and MD files</p>
            </div>
            <label className={`cursor-pointer ${uploadingFile ? 'opacity-50 pointer-events-none' : ''}`}>
              <input
                type="file"
                accept=".pdf,.txt,.md"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                <Upload className="w-4 h-4" />
                {uploadingFile ? 'Uploading...' : 'Choose file'}
              </div>
            </label>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">or paste text below</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Text Upload */}
          <div className="border border-dashed border-border rounded-xl p-6 space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Document title</label>
              <Input
                placeholder="e.g. Next.js App Router Guide"
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block flex items-center gap-1">
                <Link className="w-3.5 h-3.5" />
                Source URL
                <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <Input
                placeholder="https://..."
                value={sourceUrl}
                onChange={e => setSourceUrl(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Content</label>
              <Textarea
                placeholder="Paste document content here..."
                value={content}
                onChange={e => setContent(e.target.value)}
                className="min-h-48 resize-none"
              />
            </div>
            <Button
              onClick={handleUpload}
              disabled={uploading || !title || !content}
              className="w-full"
            >
              <Upload className="w-4 h-4 mr-2" />
              {uploading ? 'Processing & indexing...' : 'Upload & Index'}
            </Button>
          </div>
        </div>
      )}

      {/* Documents Tab */}
      {activeTab === 'documents' && (
        <div className="space-y-3">
          {documents.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No documents yet</p>
              <p className="text-xs mt-1">Upload content to get started</p>
            </div>
          ) : (
            documents.map(doc => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-4 rounded-xl border border-border hover:border-border/80 hover:bg-muted/30 transition-all group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{doc.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(doc.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                      {' · '}
                      <span className="text-primary font-medium">{(doc as any).chunks?.[0]?.count || 0} chunks</span>
                      {doc.source_url && (
                        <> · <a href={doc.source_url} target="_blank" className="underline hover:text-foreground">{new URL(doc.source_url).hostname}</a></>
                      )}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(doc.id)}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all w-8 h-8"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && config && (
        <div className="space-y-6">
          <div className="border border-border rounded-xl p-6 space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Persona name</label>
              <Input
                value={config.persona}
                onChange={e => setConfig({ ...config, persona: e.target.value })}
                placeholder="e.g. Assistant"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">System prompt</label>
              <Textarea
                value={config.system_prompt}
                onChange={e => setConfig({ ...config, system_prompt: e.target.value })}
                className="min-h-32 resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Model</label>
                <Input
                  value={config.model}
                  onChange={e => setConfig({ ...config, model: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Results to retrieve (k)</label>
                <Input
                  type="number"
                  value={config.retrieval_k}
                  onChange={e => setConfig({ ...config, retrieval_k: parseInt(e.target.value) })}
                />
              </div>
            </div>
            <Button onClick={handleSaveConfig} disabled={savingConfig} className="w-full">
              {savingConfig ? 'Saving...' : 'Save settings'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}