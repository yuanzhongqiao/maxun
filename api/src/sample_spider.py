import scrapy

class SampleSpider(scrapy.Spider):
    name = 'SampleSpider'
    start_urls = ['https://www.google.com/']

    def parse(self, response):
        print(response.body)