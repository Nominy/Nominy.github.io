import { useState } from "preact/hooks";

const EndlessCarousel = ({ children, items }) => {
  const [currentIndex, setCurrentIndex] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(true);

  const itemsWithClone = items;
  console.log(itemsWithClone)

  const handlePrevious = () => {
    setIsTransitioning(false);
    setCurrentIndex(currentIndex - 1);
  };

  const handleNext = () => {
    setIsTransitioning(false);
    setCurrentIndex(currentIndex + 1);
  };

  const handleEndTransition = () => {
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
        Previous
      </button>
      <button
        className="carousel-next"
        onClick={handleNext}
        disabled={!isTransitioning}
      >
        Next
      </button>
    </div>
  );
};

export default EndlessCarousel;
