import type { PreactDOMAttributes } from "preact";
import { useState } from "preact/hooks";

interface EndlessCarouselProps {
  children: PreactDOMAttributes[];
  items: any[]; 
}

const EndlessCarousel = ({ children, items }: EndlessCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState<number>(1);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(true);

  const itemsWithClone: any[] = items; 

  const handlePrevious = (): void => {
    setIsTransitioning(false);
    setCurrentIndex(currentIndex - 1);
  };

  const handleNext = (): void => {
    setIsTransitioning(false);
    setCurrentIndex(currentIndex + 1);
  };

  const handleEndTransition = (): void => {
    setIsTransitioning(true);

    if (currentIndex === 0) {
      setCurrentIndex(itemsWithClone.length - 2);
    } else if (currentIndex === itemsWithClone.length - 1) {
      setCurrentIndex(1);
    }
  };

  const styleWrapper = {
    position: "absolute",
    display: "flex",
    width: "100%",
    height: "100%",
    left: `-${currentIndex * 100}%`,
    transition: isTransitioning ? "left 0s ease-in-out" : "left 0.5s ease-in-out",
  };

  return (
    <div className="carousel-container">
      <div style={styleWrapper} onTransitionEnd={handleEndTransition}>
        { children }
      </div>
      <button
        className="carousel-previous"
        onClick={handlePrevious}
        disabled={!isTransitioning}
      >
      </button>
      <button
        className="carousel-next"
        onClick={handleNext}
        disabled={!isTransitioning}
      >
      </button>
    </div>
  );
};

export default EndlessCarousel;
