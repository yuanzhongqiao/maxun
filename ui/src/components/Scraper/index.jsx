import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';

const Scraper = () => {
  const [url, setUrl] = useState('');
  const [selectedSelectors, setSelectedSelectors] = useState([]);
  const [scrapedData, setScrapedData] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleSelectElement = async (selector) => {
      try {
        await window.playwright.selectElement(selector);
        setSelectedSelectors((prevSelectors) => [...prevSelectors, selector]);
      } catch (error) {
        console.error('Error selecting element:', error);
      }
    };

    window.playwright = {
      selectElement: handleSelectElement,
    };

    return () => {
      window.playwright = null;
    };
  }, []);

  const handleUrlChange = (e) => {
    setUrl(e.target.value);
  };

  const handleOpenSite = async () => {
    try {
      const containerId = containerRef.current.id;
      const response = await axios.post('http://localhost:3000/scrape', { url, containerId });

      // Mount the Playwright context into the frontend container
      if (response.data.success) {
        const { context } = response.data;
        await context.setDefaultViewportSize({ width: 1280, height: 720 });
        await context.exposeBinding('selectElement', async (selector) => {
          const selection = {
            name: `selection_${selectedSelectors.length + 1}`,
            selector,
          };
          setSelectedSelectors((prevSelectors) => [...prevSelectors, selection]);
        });
        ReactDOM.render(<div id="playwright-container" />, containerRef.current);
        await context.mount(document.getElementById('playwright-container'));
      } else {
        console.error('Error opening site:', response.data.error);
      }
    } catch (error) {
      console.error('Error opening site:', error);
    }
  };

  const handleScrape = async () => {
    try {
      const response = await axios.post('http://localhost:3000/scrape', { selectedSelectors });
      setScrapedData(response.data);
    } catch (error) {
      console.error('Error scraping:', error);
    }
  };

  return (
    <div>
      <input type="text" value={url} onChange={handleUrlChange} placeholder="Enter URL" />
      <button onClick={handleOpenSite}>Open Site</button>
      <div ref={containerRef} style={{ width: '100%', height: '500px', border: '1px solid black' }} />
      <button onClick={handleScrape}>Scrape Data</button>
      <p>Selected Elements:</p>
      <ul>
        {selectedSelectors.map((selector, index) => (
          <li key={index}>{selector}</li>
        ))}
      </ul>
      {scrapedData && (
        <div>
          <h2>Scraped Data:</h2>
          <pre>{JSON.stringify(scrapedData, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default Scraper;