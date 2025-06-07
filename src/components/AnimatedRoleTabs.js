import React, { useState, useRef, useEffect } from 'react';

// Props:
// activeTab: string ('keeper', 'developer', 'contributor')
// setActiveTab: function (newTab: string) => void
function AnimatedRoleTabs({ activeTab, setActiveTab }) {
  const [highlightStyle, setHighlightStyle] = useState({
    opacity: 0, // Start hidden until positioned
    width: '0px',
    height: '0px',
    transform: 'translateX(0px)',
    transition: 'none',
  });

  const tabsContainerRef = useRef(null);
  const keeperButtonRef = useRef(null);
  const developerButtonRef = useRef(null);
  const contributorButtonRef = useRef(null);

  const isFirstRenderRef = useRef(true); // To prevent animation on initial load

  // Map tab IDs to their refs for easier access
  const buttonRefs = {
    keeper: keeperButtonRef,
    developer: developerButtonRef,
    contributor: contributorButtonRef,
  };

  const tabRefs = useRef([]);

  // Function to update the highlight's style
  // It positions the highlight under the given targetElement
  const updateHighlightPosition = (targetElement, animate = true) => {
    if (targetElement && tabsContainerRef.current) {
      // Get dimensions and position of the target button
      // offsetWidth/Height include padding and border
      // offsetLeft is relative to the offsetParent (tabsContainerRef)
      const targetWidth = targetElement.offsetWidth;
      const targetHeight = targetElement.offsetHeight;
      const targetOffsetLeft = targetElement.offsetLeft;
      const targetOffsetTop = targetElement.offsetTop;

      // Update the style for the highlight div
      setHighlightStyle({
        opacity: 1, // Make it visible
        width: `${targetWidth}px`,
        height: `${targetHeight}px`,
        transform: `translate(${targetOffsetLeft}px, ${targetOffsetTop}px)`, transition: animate ? 'all 0.25s ease-out' : 'none',
      });
    } else {
      // If targetElement is not valid, try to reset to active or hide
      const currentActiveButton = buttonRefs[activeTab]?.current;
      if (currentActiveButton) {
        updateHighlightPosition(currentActiveButton, animate);
      } else {
        setHighlightStyle(prev => ({ ...prev, opacity: 0, transition: 'opacity 0.25s ease-out' }));
      }
    }
  };

  useEffect(() => {
    const currentActiveButton = buttonRefs[activeTab]?.current;
    if (currentActiveButton) {
      // No animation for the very first positioning, animate for subsequent changes
      updateHighlightPosition(currentActiveButton, !isFirstRenderRef.current);
      if (isFirstRenderRef.current) {
        isFirstRenderRef.current = false;
      }
    }
  }, [activeTab]); // Rerun this effect when activeTab changes

  useEffect(() => {
    const handleResize = () => {
      const node = tabRefs.current[activeTab];
      if (node) {
        setHighlightStyle({
          left: node.offsetLeft,
          width: node.offsetWidth,
        });
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeTab]);

  const handleMouseEnter = (event) => {
    updateHighlightPosition(event.currentTarget, true);
  };

  const handleMouseLeaveContainer = () => {
    const currentActiveButton = buttonRefs[activeTab]?.current;
    if (currentActiveButton) {
      updateHighlightPosition(currentActiveButton, true);
    } else {
      setHighlightStyle(prev => ({ ...prev, opacity: 0, transition: 'opacity 0.25s ease-out' }));
    }
  };

  const TABS_DATA = [
    { id: 'keeper', label: 'Keeper', ref: keeperButtonRef },
    { id: 'developer', label: 'Developer', ref: developerButtonRef },
    { id: 'contributor', label: 'Contributor', ref: contributorButtonRef },
  ];

  return (
    <div
      ref={tabsContainerRef}
      className="relative flex justify-between items-center my-5 sm:my-10 bg-[#181818F0] p-2 rounded-lg"
      onMouseLeave={handleMouseLeaveContainer}
    >
      <div
        className="absolute top-0 left-0 rounded-lg bg-gradient-to-r from-[#D9D9D924] to-[#14131324] border border-[#4B4A4A]"
        style={highlightStyle}
      />

      {TABS_DATA.map((tabInfo, idx) => (
        <button
          key={tabInfo.id}
          ref={el => tabRefs.current[idx] = el}
          className={`w-[33%] text-[#FFFFFF] text-[10px] xs:text-xs md:text-lg lg:text-xl p-2 xs:p-3 sm:p-4 rounded-lg relative z-[1] ${activeTab === tabInfo.id
            ? "bg-gradient-to-r from-[#D9D9D924] to-[#14131324] border border-[#4B4A4A]" // Active button style
            : "bg-transparent" // Inactive button style (allows highlight to show through on hover)
            }`}
          onClick={() => setActiveTab(tabInfo.id)}
          onMouseEnter={handleMouseEnter}
        >
          <h2>{tabInfo.label}</h2>
        </button>
      ))}
    </div>
  );
}

export default AnimatedRoleTabs;