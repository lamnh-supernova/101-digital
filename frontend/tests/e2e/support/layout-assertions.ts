import { expect, type Page } from '@playwright/test';

export async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const metrics = await page.evaluate(() => {
    const clientWidth = document.documentElement.clientWidth;

    function isContainedByHorizontalScroller(element: Element): boolean {
      let parent = element.parentElement;

      while (parent !== null && parent !== document.documentElement) {
        const style = getComputedStyle(parent);
        const rectangle = parent.getBoundingClientRect();
        const clipsHorizontally = ['auto', 'scroll', 'hidden', 'clip'].includes(style.overflowX);
        const isInsideViewport = rectangle.left >= -1 && rectangle.right <= clientWidth + 1;

        if (clipsHorizontally && isInsideViewport && parent.scrollWidth > parent.clientWidth + 1) {
          return true;
        }

        parent = parent.parentElement;
      }

      return false;
    }

    const offenders = Array.from(document.querySelectorAll('*'))
      .map((element) => {
        const rectangle = element.getBoundingClientRect();
        return {
          contained: isContainedByHorizontalScroller(element),
          element: `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ''}`,
          left: Math.round(rectangle.left),
          right: Math.round(rectangle.right),
        };
      })
      .filter(({ contained, left, right }) => !contained && (left < -1 || right > clientWidth + 1))
      .slice(0, 8);

    return {
      clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      offenders,
    };
  });

  expect(metrics.offenders, JSON.stringify(metrics)).toEqual([]);
  expect(metrics.scrollWidth, JSON.stringify(metrics)).toBeLessThanOrEqual(metrics.clientWidth);
}
