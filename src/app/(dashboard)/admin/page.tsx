'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Trash2, Upload, FileText, Settings } from 'lucide-react'
import { Document, AgentConfig } from '@/types'

export default function AdminPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [config, setConfig] = useState<AgentConfig | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [savingConfig, setSavingConfig] = useState(false)
  const [message, setMessage] = useState('')
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

  const handleUpload = async () => {
    if (!title || !content) return
    setUploading(true)
    setMessage('')

    const res = await fetch('/api/ingest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content, source_url: sourceUrl }),
    })

    const data = await res.json()

    if (res.ok) {
      setMessage(`✅ Uploaded! Created ${data.chunksCount} chunks.`)
      setTitle('')
      setContent('')
      setSourceUrl('')
      fetchDocuments()
    } else {
      setMessage(`❌ Error: ${data.error}`)
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

    await supabase
      .from('agent_configs')
      .upsert({ ...config })

    setSavingConfig(false)
    setMessage('✅ Settings saved!')
    setTimeout(() => setMessage(''), 3000)
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Admin Panel</h1>
        <p className="text-muted-foreground">Manage your knowledge base and agent settings</p>
      </div>

      {message && (
        <div className="p-3 rounded-lg bg-muted text-sm">{message}</div>
      )}

      <Tabs defaultValue="upload">
        <TabsList>
          <TabsTrigger value="upload">
            <Upload className="w-4 h-4 mr-2" />
            Upload
          </TabsTrigger>
          <TabsTrigger value="documents">
            <FileText className="w-4 h-4 mr-2" />
            Documents ({documents.length})
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Add Document</CardTitle>
              <CardDescription>Paste content to add to your knowledge base</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Document title"
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
              <Input
                placeholder="Source URL (optional)"
                value={sourceUrl}
                onChange={e => setSourceUrl(e.target.value)}
              />
              <Textarea
                placeholder="Paste document content here..."
                value={content}
                onChange={e => setContent(e.target.value)}
                className="min-h-48"
              />
              <Button onClick={handleUpload} disabled={uploading || !title || !content}>
                {uploading ? 'Processing...' : 'Upload & Index'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Knowledge Base</CardTitle>
              <CardDescription>{documents.length} documents indexed</CardDescription>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <p className="text-muted-foreground text-sm">No documents yet. Upload some content to get started.</p>
              ) : (
                <div className="space-y-3">
                  {documents.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{doc.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(doc.created_at).toLocaleDateString()}
                          {doc.source_url && (
                            <> · <a href={doc.source_url} target="_blank" className="underline">{doc.source_url}</a></>
                          )}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(doc.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="mt-4">
          {config && (
            <Card>
              <CardHeader>
                <CardTitle>Agent Configuration</CardTitle>
                <CardDescription>Customize how your agent behaves</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Persona name</label>
                  <Input
                    value={config.persona}
                    onChange={e => setConfig({ ...config, persona: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">System prompt</label>
                  <Textarea
                    value={config.system_prompt}
                    onChange={e => setConfig({ ...config, system_prompt: e.target.value })}
                    className="mt-1 min-h-32"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Model</label>
                    <Input
                      value={config.model}
                      onChange={e => setConfig({ ...config, model: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Results to retrieve (k)</label>
                    <Input
                      type="number"
                      value={config.retrieval_k}
                      onChange={e => setConfig({ ...config, retrieval_k: parseInt(e.target.value) })}
                      className="mt-1"
                    />
                  </div>
                </div>
                <Button onClick={handleSaveConfig} disabled={savingConfig}>
                  {savingConfig ? 'Saving...' : 'Save settings'}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}