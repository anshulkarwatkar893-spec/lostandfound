import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { ItemCard } from '@/components/items/ItemCard';
import { ItemFilters } from '@/components/items/ItemFilters';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, PackageSearch } from 'lucide-react';

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
}

export default function Dashboard() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<'all' | 'lost' | 'found'>('found');
  const [locationFilter, setLocationFilter] = useState('');

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('type', 'found')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching items:', error);
    } else {
      setItems((data as Item[]) || []);
    }
    setLoading(false);
  };

  const filteredItems = items.filter((item) => {
    const matchesType = typeFilter === 'all' || item.type === typeFilter;
    const matchesLocation = !locationFilter || 
      item.location.toLowerCase().includes(locationFilter.toLowerCase());
    return matchesType && matchesLocation;
  });

  return (
    <Layout>
      <div className="animate-fade-in">
        {/* Header */}
        <div className="mb-6">
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            Found Items
          </h1>
          <p className="text-muted-foreground">
            Browse found items reported by the campus community
          </p>
        </div>

        {/* Filters */}
        <ItemFilters
          typeFilter={typeFilter}
          setTypeFilter={setTypeFilter}
          locationFilter={locationFilter}
          setLocationFilter={setLocationFilter}
          hiddenTypeFilter
        />

        {/* Items Grid */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <PackageSearch className="w-16 h-16 text-muted-foreground/50 mb-4" />
            <h3 className="font-display text-xl font-semibold text-foreground mb-2">
              No items found
            </h3>
            <p className="text-muted-foreground">
              {items.length === 0
                ? 'Be the first to post a found item!'
                : 'Try adjusting your filters'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((item, index) => (
              <div 
                key={item.id} 
                className="animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <ItemCard
                  id={item.id}
                  type={item.type}
                  title={item.title}
                  description={item.description || undefined}
                  location={item.location}
                  imageUrl={item.image_url || undefined}
                  date={item.date}
                  labels={item.labels || undefined}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}