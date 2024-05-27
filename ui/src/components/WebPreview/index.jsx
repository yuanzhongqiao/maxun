import React, { useState } from 'react';
import { getCssSelector } from 'css-selector-generator';
import axios from 'axios';

function WebPreview({ html, setHtml, elements }) {
  const [url, setUrl] = useState(null);
  const [isFetching, setIsFetching] = useState(false);

  async function loadWebsite() {
    try {
      setIsFetching(true);
      const response = await axios.post('http://localhost:3000/load-website', {
        url: 'https://syehan-travelize.netlify.app/',
      });
      console.log('Response:', response.data);
      setHtml(response.data);
      setIsFetching(false);
    } catch (error) {
      console.error('Error loading website:', error);
    }
  }

  return (
    <div className="border border-gray-300 p-4 mb-4">
      <button
        onClick={() => loadWebsite()}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Load Website
      </button>
      <h2 className="text-lg font-semibold mb-2">Web Page Preview</h2>
      {html && html.length > 0 ? (
        <iframe
          srcDoc={html}
          sandbox="allow-forms allow-scripts"
          style={{ width: '850px', height: '620px', resize: 'both' }}
        ></iframe>
      ) : (
        <p className="text-gray-500">No website loaded</p>
      )}
    </div>
  );
}

export default WebPreview;
