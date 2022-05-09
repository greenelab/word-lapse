import tippy, { hideAll } from "tippy.js";
import "tippy.js/dist/tippy.css";

// tippy options
const options = {
  offset: [0, 10],
  delay: [50, 0],
  duration: [200, 200],
  allowHTML: true,
  interactive: true,
  appendTo: document.body,
  onShow: (instance) => {
    hideAll();
    const content = instance?.reference?.getAttribute("data-tooltip")?.trim();
    if (!content) return false;
    instance?.setContent(content);
  },
  onHide: (instance) => instance?.reference !== document.activeElement,
};

// listen for changes to document
new MutationObserver(() => {
  for (const element of document.querySelectorAll("[data-tooltip]")) {
    // get tooltip content from attached attribute
    const content = element.getAttribute("data-tooltip")?.trim();

    // if tippy instance doesn't exist for element yet, create one
    if (!element._tippy) tippy(element, options);

    // update tippy content
    element.setAttribute("aria-label", content);
    element._tippy.setContent(content);

    // force re-position after rendering updates
    if (element._tippy.popperInstance)
      window.setTimeout(element._tippy.popperInstance.update, 10);
  }
}).observe(document.body, {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ["data-tooltip"],
});
