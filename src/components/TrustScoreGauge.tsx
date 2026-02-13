import { cn } from '@/lib/utils';

interface TrustScoreGaugeProps {
  score: number; // 0-100
  size?: 'sm' | 'md' | 'lg';
}

export function TrustScoreGauge({ score, size = 'md' }: TrustScoreGaugeProps) {
  const normalizedScore = Math.max(0, Math.min(100, score));
  
  // Calculate color based on score
  const getColor = (score: number) => {
    if (score <= 40) return 'hsl(var(--destructive))';
    if (score <= 70) return 'hsl(var(--warning))';
    return 'hsl(var(--success))';
  };

  const color = getColor(normalizedScore);
  
  // SVG dimensions based on size
  const dimensions = {
    sm: { width: 80, height: 50, strokeWidth: 6, fontSize: 12 },
    md: { width: 120, height: 75, strokeWidth: 8, fontSize: 16 },
    lg: { width: 160, height: 100, strokeWidth: 10, fontSize: 20 }
  };

  const { width, height, strokeWidth, fontSize } = dimensions[size];
  const radius = (width - strokeWidth) / 2;
  const circumference = Math.PI * radius;
  const progress = (normalizedScore / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative">
        <svg 
          width={width} 
          height={height} 
          viewBox={`0 0 ${width} ${height}`}
          className="overflow-visible"
        >
          {/* Background arc */}
          <path
            d={`M ${strokeWidth/2} ${height} A ${radius} ${radius} 0 0 1 ${width - strokeWidth/2} ${height}`}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {/* Progress arc */}
          <path
            d={`M ${strokeWidth/2} ${height} A ${radius} ${radius} 0 0 1 ${width - strokeWidth/2} ${height}`}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            style={{ 
              transition: 'stroke-dashoffset 0.8s ease-out, stroke 0.3s ease',
            }}
          />
        </svg>
        {/* Score text */}
        <div 
          className="absolute left-1/2 -translate-x-1/2 font-bold"
          style={{ 
            bottom: '0px', 
            fontSize: `${fontSize}px`,
            color 
          }}
        >
          {normalizedScore}
        </div>
      </div>
      <span className="text-xs text-muted-foreground font-medium">Trust Score</span>
    </div>
  );
}
