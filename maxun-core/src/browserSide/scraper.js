/* eslint-disable @typescript-eslint/no-unused-vars */

const area = (element) => element.offsetHeight * element.offsetWidth;

function getBiggestElement(selector) {
  const elements = Array.from(document.querySelectorAll(selector));
  const biggest = elements.reduce(
    (max, elem) => (
      area(elem) > area(max) ? elem : max),
    { offsetHeight: 0, offsetWidth: 0 },
  );
  return biggest;
}

/**
 * Generates structural selector (describing element by its DOM tree location).
 *
 * **The generated selector is not guaranteed to be unique!** (In fact, this is
 *    the desired behaviour in here.)
 * @param {HTMLElement} element Element being described.
 * @returns {string} CSS-compliant selector describing the element's location in the DOM tree.
 */
function GetSelectorStructural(element) {
  // Base conditions for the recursive approach.
  if (element.tagName === 'BODY') {
    return 'BODY';
  }
  const selector = element.tagName;
  if (element.parentElement) {
    return `${GetSelectorStructural(element.parentElement)} > ${selector}`;
  }

  return selector;
}

/**
 * Heuristic method to find collections of "interesting" items on the page.
 * @returns {Array<HTMLElement>} A collection of interesting DOM nodes
 *  (online store products, plane tickets, list items... and many more?)
 */
function scrapableHeuristics(maxCountPerPage = 50, minArea = 20000, scrolls = 3, metricType = 'size_deviation') {
  const restoreScroll = (() => {
    const { scrollX, scrollY } = window;
    return () => {
      window.scrollTo(scrollX, scrollY);
    };
  })();

  /**
* @typedef {Array<{x: number, y: number}>} Grid
*/

  /**
 * Returns an array of grid-aligned {x,y} points.
 * @param {number} [granularity=0.005] sets the number of generated points
 *  (the higher the granularity, the more points).
 * @returns {Grid} Array of {x, y} objects.
 */
  function getGrid(startX = 0, startY = 0, granularity = 0.005) {
    const width = window.innerWidth;
    const height = window.innerHeight;

    const out = [];
    for (let x = 0; x < width; x += 1 / granularity) {
      for (let y = 0; y < height; y += 1 / granularity) {
        out.push({ x: startX + x, y: startY + y });
      }
    }
    return out;
  }

  let maxSelector = { selector: 'body', metric: 0 };

  const updateMaximumWithPoint = (point) => {
    const currentElement = document.elementFromPoint(point.x, point.y);
    const selector = GetSelectorStructural(currentElement);

    const elements = Array.from(document.querySelectorAll(selector))
      .filter((element) => area(element) > minArea);

    // If the current selector targets less than three elements,
    // we consider it not interesting (would be a very underwhelming scraper)
    if (elements.length < 3) {
      return;
    }

    let metric = null;

    if (metricType === 'total_area') {
      metric = elements
        .reduce((p, x) => p + area(x), 0);
    } else if (metricType === 'size_deviation') {
      // This could use a proper "statistics" approach... but meh, so far so good!
      const sizes = elements
        .map((element) => area(element));

      metric = (1 - (Math.max(...sizes) - Math.min(...sizes)) / Math.max(...sizes));
    }

    // console.debug(`Total ${metricType} is ${metric}.`)
    if (metric > maxSelector.metric && elements.length < maxCountPerPage) {
      maxSelector = { selector, metric };
    }
  };

  for (let scroll = 0; scroll < scrolls; scroll += 1) {
    window.scrollTo(0, scroll * window.innerHeight);

    const grid = getGrid();

    grid.forEach(updateMaximumWithPoint);
  }

  restoreScroll();

  let out = Array.from(document.querySelectorAll(maxSelector.selector));

  const different = (x, i, a) => a.findIndex((e) => e === x) === i;
  // as long as we don't merge any two elements by substituing them for their parents,
  // we substitute.
  while (out.map((x) => x.parentElement).every(different)
    && out.forEach((x) => x.parentElement !== null)) {
    out = out.map((x) => x.parentElement ?? x);
  }

  return out;
}

/**
 * Returns a "scrape" result from the current page.
 * @returns {Array<Object>} *Curated* array of scraped information (with sparse rows removed)
 */
// Wrap the entire function in an IIFE (Immediately Invoked Function Expression)
// and attach it to the window object
(function (window) {
  /**
   * Returns a "scrape" result from the current page.
   * @returns {Array<Object>} *Curated* array of scraped information (with sparse rows removed)
   */
  window.scrape = function (selector = null) {
    /**
     * **crudeRecords** contains uncurated rundowns of "scrapable" elements
     * @type {Array<Object>}
     */
    const crudeRecords = (selector
      ? Array.from(document.querySelectorAll(selector))
      : scrapableHeuristics())
      .map((record) => ({
        ...Array.from(record.querySelectorAll('img'))
          .reduce((p, x, i) => {
            let url = null;
            if (x.srcset) {
              const urls = x.srcset.split(', ');
              [url] = urls[urls.length - 1].split(' ');
            }

            /**
               * Contains the largest elements from `srcset` - if `srcset` is not present, contains
               * URL from the `src` attribute
               *
               * If the `src` attribute contains a data url, imgUrl contains `undefined`.
               */
            let imgUrl;
            if (x.srcset) {
              imgUrl = url;
            } else if (x.src.indexOf('data:') === -1) {
              imgUrl = x.src;
            }

            return ({
              ...p,
              ...(imgUrl ? { [`img_${i}`]: imgUrl } : {}),
            });
          }, {}),
        ...record.innerText.split('\n')
          .reduce((p, x, i) => ({
            ...p,
            [`record_${String(i).padStart(4, '0')}`]: x.trim(),
          }), {}),
      }));

    return crudeRecords;
  };

  /**
   * Given an object with named lists of elements,
   *  groups the elements by their distance in the DOM tree.
   * @param {Object.<string, {selector: string, tag: string}>} lists The named lists of HTML elements.
   * @returns {Array.<Object.<string, string>>}
   */
  window.scrapeSchema = function (lists) {
    function omap(object, f, kf = (x) => x) {
      return Object.fromEntries(
        Object.entries(object)
          .map(([k, v]) => [kf(k), f(v)]),
      );
    }

    function ofilter(object, f) {
      return Object.fromEntries(
        Object.entries(object)
          .filter(([k, v]) => f(k, v)),
      );
    }

    function getSeedKey(listObj) {
      const maxLength = Math.max(...Object.values(omap(listObj, (x) => document.querySelectorAll(x.selector).length)));
      return Object.keys(ofilter(listObj, (_, v) => document.querySelectorAll(v.selector).length === maxLength))[0];
    }

    function getMBEs(elements) {
      return elements.map((element) => {
        let candidate = element;
        const isUniqueChild = (e) => elements
          .filter((elem) => e.parentNode?.contains(elem))
          .length === 1;

        while (candidate && isUniqueChild(candidate)) {
          candidate = candidate.parentNode;
        }

        return candidate;
      });
    }

    const seedName = getSeedKey(lists);
    const seedElements = Array.from(document.querySelectorAll(lists[seedName].selector));
    const MBEs = getMBEs(seedElements);

    return MBEs.map((mbe) => omap(
      lists,
      ({ selector, attribute }, key) => {
        const elem = Array.from(document.querySelectorAll(selector)).find((elem) => mbe.contains(elem));
        if (!elem) return undefined;

        switch (attribute) {
          case 'href':
            return elem.getAttribute('href');
          case 'src':
            return elem.getAttribute('src');
          case 'innerText':
            return elem.innerText;
          case 'textContent':
            return elem.textContent;
          default:
            return elem.innerText;
        }
      },
      (key) => key // Use the original key in the output
    ));
  }


  /**
 * Scrapes multiple lists of similar items based on a template item.
 * @param {Object} config - Configuration object
 * @param {string} config.listSelector - Selector for the list container(s)
 * @param {Object.<string, {selector: string, attribute?: string}>} config.fields - Fields to scrape
 * @param {number} [config.limit] - Maximum number of items to scrape per list (optional)
 * @param {boolean} [config.flexible=false] - Whether to use flexible matching for field selectors
 * @returns {Array.<Array.<Object>>} Array of arrays of scraped items, one sub-array per list
 */
window.scrapeList = function(config) {
  const { listSelector, fields, limit, flexible = false } = config;
  
  const lists = Array.from(document.querySelectorAll(listSelector));
  
  return lists.map(list => {
    const listItems = Array.from(list.children);
    
    const itemsToScrape = limit ? listItems.slice(0, limit) : listItems;
    
    // scrape each item
    return itemsToScrape.map(item => {
      const scrapedItem = {};
      
      for (const [fieldName, fieldConfig] of Object.entries(fields)) {
        let element;
        
        if (flexible) {
          // try multiple strategies to find the element
          element = item.querySelector(fieldConfig.selector) ||
                    item.querySelector(`[class*="${fieldConfig.selector}"]`) ||
                    Array.from(item.querySelectorAll('*'))
                      .find(el => el.textContent.trim() === fieldConfig.selector);
        } else {
          element = item.querySelector(fieldConfig.selector);
        }
        
        if (element) {
          switch (fieldConfig.attribute) {
            case 'href':
              scrapedItem[fieldName] = element.getAttribute('href');
              break;
            case 'src':
              scrapedItem[fieldName] = element.getAttribute('src');
              break;
            case 'textContent':
              scrapedItem[fieldName] = element.textContent.trim();
              break;
            case 'innerText':
            default:
              scrapedItem[fieldName] = element.innerText.trim();
              break;
          }
        } else {
          scrapedItem[fieldName] = null;
        }
      }
      
      return scrapedItem;
    });
  });
};

})(window);