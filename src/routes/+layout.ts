// Every page is prerendered to real HTML at build time, so crawlers and no-JS visitors get content.
// Anything that needs the browser (index loading, the search worker, URL state) runs after hydration.
export const prerender = true;
