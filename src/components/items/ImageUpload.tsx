import { useState, useCallback } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface ImageUploadProps {
  onImageUploaded: (url: string) => void;
  onAnalysisComplete: (labels: string[], description: string) => void;
  imageUrl?: string;
}

export function ImageUpload({ onImageUploaded, onAnalysisComplete, imageUrl }: ImageUploadProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [preview, setPreview] = useState<string | null>(imageUrl || null);

  const uploadImage = async (file: File) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to upload images",
        variant: "destructive",
      });
      return null;
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('item-images')
      .upload(fileName, file);

    if (error) {
      console.error('Upload error:', error);
      throw error;
    }

    // Use signed URL since bucket is private
    const { data: urlData, error: signError } = await supabase.storage
      .from('item-images')
      .createSignedUrl(data.path, 60 * 60 * 24 * 365); // 1 year expiry

    if (signError) {
      console.error('Signed URL error:', signError);
      throw signError;
    }

    return urlData.signedUrl;
  };

  const analyzeImage = async (imageUrl: string) => {
    try {
      const response = await supabase.functions.invoke('analyze-image', {
        body: { imageUrl },
      });

      if (response.error) throw response.error;

      return response.data;
    } catch (error) {
      console.error('Analysis error:', error);
      throw error;
    }
  };

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image under 10MB",
        variant: "destructive",
      });
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    setUploading(true);

    try {
      // Upload image
      const url = await uploadImage(file);
      if (!url) return;

      onImageUploaded(url);

      toast({
        title: "Image uploaded",
        description: "Analyzing image with AI...",
      });

      // Analyze image
      setAnalyzing(true);
      const analysis = await analyzeImage(url);

      onAnalysisComplete(analysis.labels || [], analysis.description || '');

      toast({
        title: "Analysis complete",
        description: "AI has detected objects and generated a description",
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to process image. Please try again.",
        variant: "destructive",
      });
      setPreview(null);
    } finally {
      setUploading(false);
      setAnalyzing(false);
    }
  }, [user, onImageUploaded, onAnalysisComplete, toast]);

  const removeImage = () => {
    setPreview(null);
    onImageUploaded('');
    onAnalysisComplete([], '');
  };

  return (
    <div className="space-y-4">
      {preview ? (
        <div className="relative rounded-lg overflow-hidden border border-border">
          <img
            src={preview}
            alt="Preview"
            className="w-full aspect-video object-cover"
          />
          {(uploading || analyzing) && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">
                  {uploading ? 'Uploading...' : 'Analyzing with AI...'}
                </span>
              </div>
            </div>
          )}
          {!uploading && !analyzing && (
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2"
              onClick={removeImage}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className="w-10 h-10 text-muted-foreground mb-3" />
            <p className="mb-2 text-sm text-foreground">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-muted-foreground">PNG, JPG or WEBP (max 10MB)</p>
          </div>
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading || analyzing}
          />
        </label>
      )}
    </div>
  );
}