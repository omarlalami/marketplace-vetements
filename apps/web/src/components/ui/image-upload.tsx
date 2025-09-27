'use client'

import { useState, useCallback } from 'react'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import { Button } from './button'
import { cn } from '@/lib/utils'

interface ImageUploadProps {
  onImagesChange: (files: File[]) => void
  maxFiles?: number
  maxSizePerFile?: number // en MB
  className?: string
}

export function ImageUpload({ 
  onImagesChange, 
  maxFiles = 10, 
  maxSizePerFile = 5,
  className 
}: ImageUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState('')

  const generatePreview = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.readAsDataURL(file)
    })
  }

  const validateFile = (file: File): string | null => {
    if (!file.type.startsWith('image/')) {
      return 'Seules les images sont autorisées'
    }
    if (file.size > maxSizePerFile * 1024 * 1024) {
      return `L'image doit faire moins de ${maxSizePerFile}MB`
    }
    return null
  }

  const handleFiles = useCallback(async (files: FileList) => {
    setError('')
    const newFiles: File[] = []
    const newPreviews: string[] = []

    // Vérifier le nombre total de fichiers
    if (selectedFiles.length + files.length > maxFiles) {
      setError(`Maximum ${maxFiles} images autorisées`)
      return
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const validationError = validateFile(file)
      
      if (validationError) {
        setError(validationError)
        return
      }

      newFiles.push(file)
      const preview = await generatePreview(file)
      newPreviews.push(preview)
    }

    const updatedFiles = [...selectedFiles, ...newFiles]
    const updatedPreviews = [...previews, ...newPreviews]

    setSelectedFiles(updatedFiles)
    setPreviews(updatedPreviews)
    onImagesChange(updatedFiles)
  }, [selectedFiles, previews, maxFiles, maxSizePerFile, onImagesChange])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const removeImage = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index)
    const newPreviews = previews.filter((_, i) => i !== index)
    
    setSelectedFiles(newFiles)
    setPreviews(newPreviews)
    onImagesChange(newFiles)
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Zone de drop */}
        <div
        className={cn(
            "relative border-2 border-dashed rounded-lg p-8 text-center transition-colors", // 👈 relative ici
            dragOver 
            ? "border-primary bg-primary/5" 
            : "border-muted-foreground/25 hover:border-muted-foreground/50"
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        >
        <div className="flex flex-col items-center justify-center space-y-4 pointer-events-none">
            <div className="p-4 bg-muted rounded-full">
            <Upload className="h-8 w-8 text-muted-foreground" />
            </div>
            
            <div className="space-y-2">
            <p className="text-lg font-medium">Glissez vos images ici</p>
            <p className="text-sm text-muted-foreground">ou cliquez pour sélectionner des fichiers</p>
            <p className="text-xs text-muted-foreground">
                PNG, JPG jusqu'à {maxSizePerFile}MB chacune (max {maxFiles} images)
            </p>
            </div>
        </div>

        {/* input invisible qui prend exactement la zone grise */}
        <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileInput}
            className="absolute inset-0 opacity-0 cursor-pointer"
        />
        </div>

      {/* Erreur */}
      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
          {error}
        </div>
      )}

      {/* Aperçu des images */}
      {previews.length > 0 && (
        <div className="space-y-4">
          <p className="text-sm font-medium">
            Images sélectionnées ({previews.length}/{maxFiles})
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {previews.map((preview, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6"
                  onClick={() => removeImage(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
                
                <div className="absolute bottom-2 left-2 right-2">
                  <p className="text-xs bg-black/50 text-white px-2 py-1 rounded truncate">
                    {selectedFiles[index]?.name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}