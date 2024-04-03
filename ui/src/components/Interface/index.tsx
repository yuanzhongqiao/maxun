import { useState } from 'react';

function DataSelection() {
  const [url, setUrl] = useState('');
  const [dataPoints, setDataPoints] = useState([]);

  const handleUrlChange = (event: any) => {
    setUrl(event.target.value);
  };

  const handleElementClick = (event: any) => {
    const element = event.target;
    const dataPointLabel = prompt('Enter data point label (e.g., Product Title)');
    if (dataPointLabel) {
      const newPoints:any = [...dataPoints]; // Copy existing data points
      newPoints.push({
        label: dataPointLabel,
        // Capture element attributes for data extraction (e.g., ID, class)
        attributes: {
          id: element.id,
          class: element.className,
        },
      });
      setDataPoints(newPoints);
    }
  };

  const handleSubmit = async () => {
    // Send URL and dataPoints to FastAPI endpoint (explained later)
    const response = await fetch('/api/scrape', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, dataPoints }),
    });
    // Handle response (e.g., display extracted data)
    const data = await response.json();
    console.log(data);
  };

  return (
    <div>
      <input type="text" value={url} onChange={handleUrlChange} placeholder="Enter target URL" />
      <div style={{ cursor: 'pointer' }} onClick={handleElementClick}>
        Select elements on the webpage...
      </div>
      <button onClick={handleSubmit}>Extract Data</button>
      {/* Display selected data points and labels for confirmation */}
    </div>
  );
}

export default DataSelection;
