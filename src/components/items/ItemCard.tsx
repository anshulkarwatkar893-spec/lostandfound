import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface ItemCardProps {
  id: string;
  type: 'lost' | 'found';
  title: string;
  description?: string;
  location: string;
  imageUrl?: string;
  date: string;
  labels?: string[];
}

export function ItemCard({ id, type, title, description, location, imageUrl, date, labels }: ItemCardProps) {
  return (
    <Link to={`/item/${id}`}>
      <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 h-full">
        {/* Image */}
        <div className="aspect-video relative overflow-hidden bg-muted">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              No Image
            </div>
          )}
          <Badge
            className={`absolute top-3 right-3 ${
              type === 'lost'
                ? 'bg-lost text-lost-foreground'
                : 'bg-found text-found-foreground'
            }`}
          >
            {type === 'lost' ? 'Lost' : 'Found'}
          </Badge>
        </div>

        <CardHeader className="pb-2">
          <h3 className="font-display font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
            {title}
          </h3>
        </CardHeader>

        <CardContent className="pb-2">
          {description && (
            <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
              {description}
            </p>
          )}
          
          {labels && labels.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {labels.slice(0, 3).map((label, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {label}
                </Badge>
              ))}
              {labels.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{labels.length - 3}
                </Badge>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="pt-0 text-sm text-muted-foreground">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              <span className="line-clamp-1">{location}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{format(new Date(date), 'MMM d')}</span>
            </div>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}