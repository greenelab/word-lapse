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
new MutationObserver((records) => {
  for (const { addedNodes, removedNodes, target, type } of records) {
    // dom addition or deletion
    if (type === "childList") {
      // create new tippy instances
      tippy(filter(addedNodes, false), options);
      // delete tippy instances
      filter(removedNodes, true).forEach((element) => element._tippy.destroy());
    }

    // data-tooltip attribute value change
    if (type === "attributes")
      if (target instanceof Element)
        // update tippy instance
        target._tippy?.setContent(target.getAttribute("data-tooltip")?.trim());
  }
}).observe(document.body, {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ["data-tooltip"],
});

// takes node list and finds all entries and children with tooltip attribute
const filter = (nodes = [], hasTippy) => {
  // skip text nodes, comment nodes, etc
  nodes = Array.from(nodes).filter((node) => node instanceof Element);

  const filteredNodes = [];
  for (const node of nodes) {
    // add node itself
    if (node.matches("[data-tooltip]") && !!node._tippy === hasTippy)
      filteredNodes.push(node);

    // add node children
    for (const child of node.querySelectorAll("[data-tooltip]"))
      if (!!child._tippy === hasTippy) filteredNodes.push(child);
  }
  return filteredNodes;
};
