import { useState } from 'react';
import axios from 'axios';
import VisualSelector from '../VisualSelector';

const Scraper = () => {
  const [url, setUrl] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [selectedElements, setSelectedElements] = useState([]);
  const [scrapedData, setScrapedData] = useState([]);

  const handleUrlChange = (e) => {
    setUrl(e.target.value);
  };

  const handleFetchWebsite = async () => {
    try {
      const response = await axios.post('http://localhost:8000/fetch-website', { url });
      setHtmlContent(response.data.html);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleElementSelection = (selectedElements) => {
    setSelectedElements(selectedElements);
  };

  const handleScrape = async () => {
    try {
      const response = await axios.post('http://localhost:8000/scrape', {
        url,
        selectedElements,
      });
      setScrapedData(response.data.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div>
      <input type="text" value={url} onChange={handleUrlChange} placeholder="Enter URL" />
      <button onClick={handleFetchWebsite}>Fetch Website</button>
      {htmlContent && (
        <VisualSelector
          htmlContent={htmlContent}
          onElementSelection={handleElementSelection}
        />
      )}
      <button onClick={handleScrape} disabled={selectedElements.length === 0}>
        Scrape
      </button>
      <pre>{JSON.stringify(scrapedData, null, 2)}</pre>
    </div>
  );
};

export default Scraper;