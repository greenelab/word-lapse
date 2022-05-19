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
  aria: { content: "describedby" },
  onShow: (instance) => {
    // close all so only one can show at a time
    hideAll();
    // don't show if tooltip content empty
    const content = instance?.reference?.getAttribute("data-tooltip")?.trim();
    if (!content) return false;
    // set/update content
    instance?.setContent(content);
    return true;
  },
};

// listen for changes to document
new MutationObserver(() => {
  for (const element of document.querySelectorAll("[data-tooltip]")) {
    // get tooltip content from attached attribute
    const content = element.getAttribute("data-tooltip")?.trim();

    // if tippy instance doesn't exist for element yet, create one
    if (!element._tippy) tippy(element, options);

    // update tippy content
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
