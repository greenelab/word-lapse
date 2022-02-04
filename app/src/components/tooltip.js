import tippy from "tippy.js";
import "tippy.js/dist/tippy.css";

// attach tooltips to elements with tooltip attribute
const attach = () => {
  // get elements with non-empty tooltips
  const elements = Array.from(
    document.querySelectorAll("[data-tooltip]")
  ).filter((element) => element.dataset.tooltip.trim());

  // add tooltip to elements
  tippy(elements, {
    content: (element) => {
      const content = element.dataset.tooltip.trim();
      // remove tooltip attribute to mark element as already-tooltipped
      element.removeAttribute("data-tooltip");
      return content;
    },
    delay: [200, 0],
    allowHTML: true,
  });
};

// listen for tooltip attributes
new MutationObserver(attach).observe(document.body, {
  subtree: true,
  attributeFilter: ["data-tooltip"],
});
