import React, { useState } from 'react';
import axios from 'axios';

function Scraper() {
  const [url, setUrl] = useState('');
  const [selections, setSelections] = useState([]);
  const [data, setData] = useState(null);

  const handleUrlChange = (e) => {
    setUrl(e.target.value);
  };

  const handleSelectElement = (e) => {
    const selection = {
      name: `selection_${selections.length + 1}`,
      selector: generateSelector(e.target),
    };
    setSelections((prevSelections) => [...prevSelections, selection]);
  };

  const generateSelector = (element) => {
    let selector = element.tagName.toLowerCase();
    let parent = element.parentNode;

    while (parent && parent.tagName !== 'HTML') {
      const id = parent.id;
      const classes = Array.from(parent.classList).join('.');

      if (id) {
        selector = `#${id} > ${selector}`;
        break;
      } else if (classes) {
        selector = `.${classes} > ${selector}`;
        break;
      } else {
        selector = `${parent.tagName.toLowerCase()} > ${selector}`;
      }

      parent = parent.parentNode;
    }

    return selector;
  };

  const handleScrape = async () => {
    try {
      const response = await axios.post('http://localhost:3000/scrape', {
        url,
        selections,
      });
      setData(response.data);
      console.log('Scraped Data', response.data);
    } catch (error) {
      console.error('Error scraping:', error);
    }
  };

  return (
    <div>
      <input
        type="text"
        placeholder="Enter URL to scrape"
        value={url}
        onChange={handleUrlChange}
      />
      <button onClick={handleScrape}>Scrape</button>
      <p>Click on the elements you want to scrape:</p>
      <iframe
        src={url}
        onLoad={(e) => {
          const iframeDocument = e.target.contentDocument;
          iframeDocument.body.onclick = handleSelectElement;
        }}
        style={{ width: '100%', height: '500px' }}
      />
      <p>Selected Elements:</p>
      <ul>
        {selections.map((selection, index) => (
          <li key={index}>
            {selection.name}: {selection.selector}
          </li>
        ))}
      </ul>
      {data && (
        <div>
          <h2>Scraped Data:</h2>
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default Scraper;