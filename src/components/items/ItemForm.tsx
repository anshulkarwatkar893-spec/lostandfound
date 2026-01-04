import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ImageUpload } from './ImageUpload';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles } from 'lucide-react';

const itemSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  location: z.string().min(2, 'Location is required'),
  date: z.string().min(1, 'Date is required'),
  contact_number: z.string().min(10, 'Please enter a valid contact number').optional().or(z.literal('')),
});

type ItemFormData = z.infer<typeof itemSchema>;

interface ItemFormProps {
  type: 'lost' | 'found';
}

export function ItemForm({ type }: ItemFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [imageUrl, setImageUrl] = useState('');
  const [labels, setLabels] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ItemFormData>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
    },
  });

  const handleAnalysisComplete = (detectedLabels: string[], generatedDescription: string) => {
    setLabels(detectedLabels);
    if (generatedDescription) {
      setValue('description', generatedDescription);
    }
  };

  const onSubmit = async (data: ItemFormData) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to post items",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase.from('items').insert({
        user_id: user.id,
        type,
        title: data.title,
        description: data.description || null,
        location: data.location,
        date: data.date,
        image_url: imageUrl || null,
        labels,
        contact_number: data.contact_number || null,
      });

      if (error) throw error;

      toast({
        title: "Success!",
        description: `Your ${type} item has been posted`,
      });

      navigate('/dashboard');
    } catch (error) {
      console.error('Error posting item:', error);
      toast({
        title: "Error",
        description: "Failed to post item. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto animate-fade-in">
      <CardHeader>
        <CardTitle className="font-display text-2xl flex items-center gap-2">
          {type === 'lost' ? '🔍 Report Lost Item' : '📦 Report Found Item'}
        </CardTitle>
        <CardDescription>
          {type === 'lost'
            ? 'Describe the item you lost so others can help find it'
            : 'Describe the item you found so the owner can claim it'}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Item Image</Label>
            <ImageUpload
              onImageUploaded={setImageUrl}
              onAnalysisComplete={handleAnalysisComplete}
              imageUrl={imageUrl}
            />
            {labels.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                <Sparkles className="w-4 h-4 text-primary" />
                {labels.map((label, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {label}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Item Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Blue iPhone 14, Red Backpack"
              {...register('title')}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Location *</Label>
            <Input
              id="location"
              placeholder="e.g., Library 2nd Floor, Cafeteria"
              {...register('location')}
            />
            {errors.location && (
              <p className="text-sm text-destructive">{errors.location.message}</p>
            )}
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date">Date {type === 'lost' ? 'Lost' : 'Found'} *</Label>
            <Input
              id="date"
              type="date"
              {...register('date')}
            />
            {errors.date && (
              <p className="text-sm text-destructive">{errors.date.message}</p>
            )}
          </div>

          {/* Contact Number */}
          <div className="space-y-2">
            <Label htmlFor="contact_number">Contact Number</Label>
            <Input
              id="contact_number"
              type="tel"
              placeholder="e.g., +1 234 567 8900"
              {...register('contact_number')}
            />
            {errors.contact_number && (
              <p className="text-sm text-destructive">{errors.contact_number.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Provide a number so finders can contact you
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Description 
              {labels.length > 0 && (
                <span className="ml-2 text-xs text-primary font-normal">
                  ✨ AI-generated
                </span>
              )}
            </Label>
            <Textarea
              id="description"
              placeholder="Add any additional details that could help identify the item..."
              rows={4}
              {...register('description')}
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-gradient-primary"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Posting...
              </>
            ) : (
              `Post ${type === 'lost' ? 'Lost' : 'Found'} Item`
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}