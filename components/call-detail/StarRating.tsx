import { useState } from 'react';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
}

const sizeClasses = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

const interactiveSizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
};

export default function StarRating({
  rating,
  maxRating = 5,
  size = 'md',
  interactive = false,
  onRatingChange,
}: StarRatingProps) {
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const sizeClass = interactive ? interactiveSizeClasses[size] : sizeClasses[size];
  const roundedRating = Math.round(rating);

  // Determine which stars should be highlighted
  // If hovering, highlight up to hovered star; otherwise use the actual rating
  const highlightThreshold = hoveredStar !== null ? hoveredStar : roundedRating;

  return (
    <div className="flex items-center">
      {Array.from({ length: maxRating }, (_, i) => i + 1).map((star) => {
        const isHighlighted = star <= highlightThreshold;
        
        return (
          <button
            key={star}
            type={interactive ? 'button' : undefined}
            onClick={interactive && onRatingChange ? () => onRatingChange(star) : undefined}
            onMouseEnter={interactive ? () => setHoveredStar(star) : undefined}
            onMouseLeave={interactive ? () => setHoveredStar(null) : undefined}
            disabled={!interactive}
            className={interactive ? 'focus:outline-none transition-transform hover:scale-110' : ''}
          >
            <svg
              className={`${sizeClass} transition-colors ${
                isHighlighted
                  ? 'text-amber-400 fill-amber-400'
                  : 'text-slate-300'
              }`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        );
      })}
    </div>
  );
}

