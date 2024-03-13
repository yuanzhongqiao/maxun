from fastapi import FastAPI
from scrapy import signals
from scrapy.crawler import CrawlerProcess
from scrapy.signalmanager import dispatcher
from sample_spider import SampleSpider
from contextlib import asynccontextmanager

app = FastAPI()

@asynccontextmanager
async def lifespan(app: FastAPI):
   
    dispatcher.connect(start_crawler, signal=signals.engine_started)
    process = CrawlerProcess(settings={
        'USffER_AGENT': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    })
    process.crawl(SampleSpider)
    process.start()

def start_crawler():
    
    spider = SampleSpider()
    crawler = CrawlerProcess()
    crawler.crawl(spider)
    crawler.start()

@app.get("/scrape")
async def scrape_endpoint():
    # Add your API endpoint logic here
    # Retrieve and return the scraped data
    return {"message": "Scraping in progress. Check logs for details."}
