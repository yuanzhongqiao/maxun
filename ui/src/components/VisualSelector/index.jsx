import React, { useState, useRef, useEffect } from 'react';
import parse from 'html-react-parser';


const VisualSelector = () => {
  const [selectedElements, setSelectedElements] = useState([]);
  const contentRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      const target = e.target as HTMLElement;
      if (selectedElements.includes(target)) {
        setSelectedElements(selectedElements.filter((el) => el !== target));
      } else {
        setSelectedElements([...selectedElements, target]);
      }
    };

    if (contentRef.current) {
      contentRef.current.addEventListener('click', handleClick);
    }

    return () => {
      if (contentRef.current) {
        contentRef.current.removeEventListener('click', handleClick);
      }
    };
  }, [selectedElements]);

  useEffect(() => {
    onElementSelection(selectedElements);
  }, [selectedElements, onElementSelection]);

  const getElementSelector = (element): string => {
    const path = Array.from(element.parentNode.childNodes)
      .indexOf(element)
      .toString();
    const selector = `${element.tagName.toLowerCase()}:nth-child(${path})`;
    return element.parentNode.tagName.toLowerCase() !== 'HTML'
      ? `${getElementSelector(element.parentNode)} > ${selector}`
      : selector;
  };

  const handleClearSelection = () => {
    setSelectedElements([]);
    onElementSelection([]);
  };

  return (
    <div>
      <div ref={contentRef}>{parse(htmlContent)}</div>
      <button onClick={handleClearSelection}>Clear Selection</button>
      <h3>Selected Elements:</h3>
      <pre>{JSON.stringify(selectedElements.map(getElementSelector), null, 2)}</pre>
    </div>
  );
};

export default VisualSelector;