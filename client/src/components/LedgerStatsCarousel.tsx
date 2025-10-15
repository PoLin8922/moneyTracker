import { useState } from "react";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface LedgerStatsCarouselProps {
  children: React.ReactNode[];
}

export default function LedgerStatsCarousel({ children }: LedgerStatsCarouselProps) {
  const [currentPage, setCurrentPage] = useState(0);

  const nextPage = () => {
    setCurrentPage((prev) => (prev + 1) % children.length);
  };

  const prevPage = () => {
    setCurrentPage((prev) => (prev - 1 + children.length) % children.length);
  };

  return (
    <div className="relative">
      <div className="overflow-hidden">
        <div 
          className="flex transition-transform duration-300 ease-in-out"
          style={{ transform: `translateX(-${currentPage * 100}%)` }}
        >
          {children.map((child, index) => (
            <div key={index} className="min-w-full">
              {child}
            </div>
          ))}
        </div>
      </div>

      {/* 導航點點 */}
      <div className="flex justify-center gap-2 mt-4">
        {children.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentPage(index)}
            className={cn(
              "w-2 h-2 rounded-full transition-all",
              currentPage === index 
                ? "bg-primary w-6" 
                : "bg-muted-foreground/30"
            )}
            data-testid={`carousel-dot-${index}`}
          />
        ))}
      </div>

      {/* 滑動提示（可選） */}
      <div className="absolute top-1/2 -translate-y-1/2 left-2 right-2 flex justify-between pointer-events-none">
        <button
          onClick={prevPage}
          className="pointer-events-auto p-1 rounded-full bg-background/50 hover:bg-background/80 transition-colors"
          data-testid="carousel-prev"
        >
          <ChevronLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <button
          onClick={nextPage}
          className="pointer-events-auto p-1 rounded-full bg-background/50 hover:bg-background/80 transition-colors"
          data-testid="carousel-next"
        >
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}
