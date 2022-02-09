// wait
export const sleep = (ms) =>
  new Promise((resolve) => window.setTimeout(resolve, ms));
