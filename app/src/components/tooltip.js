import tippy from "tippy.js";
import "tippy.js/dist/tippy.css";

// tippy options
const options = {
  offset: [0, 10],
  allowHTML: true,
  onShow: (instance) => {
    const content = instance?.reference?.getAttribute("data-tooltip")?.trim();
    if (!content) return false;
    instance?.setContent(content);
  },
  onHide: (instance) => instance?.reference !== document.activeElement,
};

// listen for changes to document
new MutationObserver(() => {
  for (const element of document.querySelectorAll("[data-tooltip]")) {
    if (!element._tippy) tippy(element, options);
    else {
      const content = element.getAttribute("data-tooltip")?.trim();
      element.setAttribute("aria-label", content);
      element._tippy.setContent(content);
    }
  }
}).observe(document.body, {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ["data-tooltip"],
});
