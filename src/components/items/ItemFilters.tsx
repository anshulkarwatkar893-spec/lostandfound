import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Filter } from 'lucide-react';

interface ItemFiltersProps {
  typeFilter: 'all' | 'lost' | 'found';
  setTypeFilter: (filter: 'all' | 'lost' | 'found') => void;
  locationFilter: string;
  setLocationFilter: (location: string) => void;
  hiddenTypeFilter?: boolean;
}

export function ItemFilters({
  typeFilter,
  setTypeFilter,
  locationFilter,
  setLocationFilter,
  hiddenTypeFilter = false,
}: ItemFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      {/* Type Filter Buttons */}
      {!hiddenTypeFilter && (
        <div className="flex gap-2">
          <Button
            variant={typeFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTypeFilter('all')}
          >
            All Items
          </Button>
          <Button
            variant={typeFilter === 'lost' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTypeFilter('lost')}
            className={typeFilter === 'lost' ? 'bg-lost hover:bg-lost/90' : ''}
          >
            Lost
          </Button>
          <Button
            variant={typeFilter === 'found' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTypeFilter('found')}
            className={typeFilter === 'found' ? 'bg-found hover:bg-found/90' : ''}
          >
            Found
          </Button>
        </div>
      )}

      {/* Location Filter */}
      <div className="relative flex-1 max-w-xs">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Filter by location..."
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
          className="pl-9"
        />
      </div>
    </div>
  );
}