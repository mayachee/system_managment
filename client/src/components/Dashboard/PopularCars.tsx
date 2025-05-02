import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";

interface PopularCar {
  id: number;
  make: string;
  model: string;
  year: number;
  status: string;
  carId: string;
  rentalCount: number;
  rating: string;
}

interface PopularCarsProps {
  cars: PopularCar[];
}

export default function PopularCars({ cars }: PopularCarsProps) {
  // Sample car images - in a real app, these would come from the API
  const carImages = [
    "https://images.unsplash.com/photo-1550355291-bbee04a92027?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100&q=80",
    "https://images.unsplash.com/photo-1619767886558-efdc259cde1a?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100&q=80",
    "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100&q=80",
    "https://images.unsplash.com/photo-1617469767053-8f35aec04b7a?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100&q=80",
  ];

  const getRandomImageUrl = (index: number) => {
    return carImages[index % carImages.length];
  };
  
  const renderStars = (rating: string) => {
    const numRating = parseFloat(rating);
    const fullStars = Math.floor(numRating);
    const hasHalfStar = numRating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    return (
      <div className="flex items-center text-amber-500">
        {[...Array(fullStars)].map((_, i) => (
          <svg key={`full-${i}`} xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        
        {hasHalfStar && (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        )}
        
        {[...Array(emptyStars)].map((_, i) => (
          <svg key={`empty-${i}`} xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        ))}
      </div>
    );
  };

  return (
    <Card className="shadow-sm">
      <div className="flex items-center justify-between p-6 pb-0">
        <h2 className="text-lg font-semibold">Popular Cars</h2>
        <Link href="/cars">
          <a className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
            View all
          </a>
        </Link>
      </div>
      <CardContent className="p-6">
        <div className="space-y-4">
          {cars.length > 0 ? (
            cars.map((car, index) => (
              <div key={car.id} className="flex items-center space-x-3">
                <div className="h-12 w-12 bg-neutral-100 dark:bg-neutral-700 rounded-md flex items-center justify-center">
                  <img 
                    src={getRandomImageUrl(index)} 
                    alt={`${car.make} ${car.model}`} 
                    className="h-10 w-10 object-cover rounded-sm" 
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">
                    {car.make} {car.model} ({car.year})
                  </p>
                  <div className="flex items-center">
                    {renderStars(car.rating)}
                    <span className="text-xs text-neutral-500 dark:text-neutral-400 ml-1">
                      {car.rating} ({car.rentalCount} rentals)
                    </span>
                  </div>
                </div>
                <div className="text-secondary-600 dark:text-secondary-400 font-medium text-sm">
                  {Math.floor(70 + Math.random() * 25)}% booked
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4 text-neutral-500 dark:text-neutral-400">
              No popular cars to display
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
