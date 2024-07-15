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

  