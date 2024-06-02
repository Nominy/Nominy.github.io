import type { PreactDOMAttributes } from "preact";
import { useState, useEffect } from "preact/hooks";
import "./styles.css";

import "preact/debug";

interface EndlessCarouselProps {
  children: PreactDOMAttributes[];
  length: number;
}

const EndlessCarousel = ({ children, length }: EndlessCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState<number>(1);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(true);

  const handlePrevious = (): void => {
    setIsTransitioning(false);
    setCurrentIndex(currentIndex - 1);
  };

  const handleNext = (): void => {
    setIsTransitioning(false);
    setCurrentIndex(currentIndex + 1);
  };

  const handleEndTransition = (e: TransitionEvent): void => {
    if (e.propertyName !== "left") return;

    setIsTransitioning(true);

    if (currentIndex === 0) {
      setCurrentIndex(length - 2);
    } else if (currentIndex === length - 1) {
      setCurrentIndex(1);
    }
  };

  const handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key === "ArrowLeft") {
      handlePrevious();
    } else if (event.key === "ArrowRight") {
      handleNext();
    }
  };

  useEffect(() => {
    if (isTransitioning)
      window.addEventListener("keydown", handleKeyDown, true);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handlePrevious, handleNext, isTransitioning]);

  const styleWrapper = {
    position: "relative",
    display: "flex",
    width: "100%",
    left: `-${currentIndex * 100}%`,
    transition: isTransitioning ? "" : "left 0.5s ease-in-out",
  };

  return (
    <>
      <div
        className={`carousel-container ${!isTransitioning ? "disable-hover" : ""}`}
      >
        <div style={styleWrapper} onTransitionEnd={handleEndTransition}>
          {children}
        </div>
      </div>
      <div className={"carousel-controls"}>
        <button
          className="carousel-previous"
          onClick={handlePrevious}
          disabled={!isTransitioning}
        ></button>
        <button
          className="carousel-next"
          onClick={handleNext}
          disabled={!isTransitioning}
        ></button>
      </div>
    </>
  );
};

export default EndlessCarousel;
