import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { MapPin, Calendar, ArrowLeft, Loader2, Sparkles, User, Trash2, Phone } from 'lucide-react';
import { ItemCard } from '@/components/items/ItemCard';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface Item {
  id: string;
  type: 'lost' | 'found';
  title: string;
  description: string | null;
  location: string;
  image_url: string | null;
  date: string;
  labels: string[] | null;
  created_at: string;
  user_id: string;
  contact_number: string | null;
}

interface Profile {
  full_name: string | null;
  email: string | null;
}

export default function ItemDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [item, setItem] = useState<Item | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [matches, setMatches] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const isOwner = user && item && user.id === item.user_id;

  const handleDelete = async () => {
    if (!item) return;
    
    setDeleting(true);
    const { error } = await supabase
      .from('items')
      .delete()
      .eq('id', item.id);

    if (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item');
      setDeleting(false);
    } else {
      toast.success('Item deleted successfully');
      navigate('/dashboard');
    }
  };

  useEffect(() => {
    if (id) {
      fetchItem(id);
    }
  }, [id]);

  const fetchItem = async (itemId: string) => {
    setLoading(true);

    // Fetch item
    const { data: itemData, error: itemError } = await supabase
      .from('items')
      .select('*')
      .eq('id', itemId)
      .single();

    if (itemError || !itemData) {
      console.error('Error fetching item:', itemError);
      setLoading(false);
      return;
    }

    setItem(itemData as Item);

    // Fetch poster name using secure function (no email exposed)
    const { data: posterName } = await supabase
      .rpc('get_poster_name', { poster_id: itemData.user_id });

    setProfile({ full_name: posterName || 'Anonymous', email: null });

    // Find potential matches
    if (itemData.labels && itemData.labels.length > 0) {
      const oppositeType = itemData.type === 'lost' ? 'found' : 'lost';
      
      const { data: allItems } = await supabase
        .from('items')
        .select('*')
        .eq('type', oppositeType)
        .neq('id', itemId);

      if (allItems) {
        // Calculate match score based on overlapping labels
        const scoredItems = (allItems as Item[]).map((otherItem) => {
          const otherLabels = otherItem.labels || [];
          const matchingLabels = itemData.labels.filter((label: string) =>
            otherLabels.some((l: string) => 
              l.toLowerCase().includes(label.toLowerCase()) ||
              label.toLowerCase().includes(l.toLowerCase())
            )
          );
          return { item: otherItem, score: matchingLabels.length };
        });

        // Filter items with at least 1 matching label, sort by score
        const matchedItems = scoredItems
          .filter((s) => s.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 4)
          .map((s) => s.item);

        setMatches(matchedItems);
      }
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!item) {
    return (
      <Layout>
        <div className="text-center py-16">
          <h2 className="font-display text-2xl font-bold mb-4">Item Not Found</h2>
          <Link to="/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="animate-fade-in">
        {/* Back Button */}
        <Link to="/dashboard" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image */}
            {item.image_url && (
              <div className="rounded-lg overflow-hidden border border-border">
                <img
                  src={item.image_url}
                  alt={item.title}
                  className="w-full aspect-video object-cover"
                />
              </div>
            )}

            {/* Details Card */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <CardTitle className="font-display text-2xl">{item.title}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge
                      className={`shrink-0 ${
                        item.type === 'lost'
                          ? 'bg-lost text-lost-foreground'
                          : 'bg-found text-found-foreground'
                      }`}
                    >
                      {item.type === 'lost' ? 'Lost' : 'Found'}
                    </Badge>
                    {isOwner && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="icon" className="shrink-0">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete this item?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete your {item.type} item post.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleDelete}
                              disabled={deleting}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {deleting ? 'Deleting...' : 'Delete'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Meta Info */}
                <div className="flex flex-wrap gap-4 text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{item.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{format(new Date(item.date), 'MMMM d, yyyy')}</span>
                  </div>
                </div>

                {/* Labels */}
                {item.labels && item.labels.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    <Sparkles className="w-4 h-4 text-primary shrink-0 mt-1" />
                    {item.labels.map((label, index) => (
                      <Badge key={index} variant="secondary">
                        {label}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Description */}
                {item.description && (
                  <div className="pt-4 border-t border-border">
                    <h3 className="font-semibold mb-2">Description</h3>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {item.description}
                    </p>
                  </div>
                )}

                {/* Contact Number */}
                {item.contact_number && (
                  <div className="pt-4 border-t border-border">
                    <h3 className="font-semibold mb-2">Contact Information</h3>
                    <a 
                      href={`tel:${item.contact_number}`}
                      className="flex items-center gap-2 text-primary hover:underline"
                    >
                      <Phone className="w-4 h-4" />
                      {item.contact_number}
                    </a>
                  </div>
                )}

                {/* Posted By */}
                <div className="pt-4 border-t border-border">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="w-4 h-4" />
                    <span>
                      Posted by {profile?.full_name || 'Anonymous'} on{' '}
                      {format(new Date(item.created_at), 'MMM d, yyyy')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Potential Matches */}
          <div className="space-y-4">
            <h3 className="font-display text-xl font-semibold">
              {item.type === 'lost' ? 'Potential Matches' : 'Could Belong To'}
            </h3>
            
            {matches.length > 0 ? (
              <div className="space-y-4">
                {matches.map((match) => (
                  <ItemCard
                    key={match.id}
                    id={match.id}
                    type={match.type}
                    title={match.title}
                    description={match.description || undefined}
                    location={match.location}
                    imageUrl={match.image_url || undefined}
                    date={match.date}
                    labels={match.labels || undefined}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <p>No potential matches found yet.</p>
                  <p className="text-sm mt-1">Check back later!</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}