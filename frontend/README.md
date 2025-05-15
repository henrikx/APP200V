Login page er en egen login.html

Etter login vil man bli omdirigert til oversiktsiden som da vil være index.html?page=oversikt. Dette håndteres av mainrouter.js og vil da laste inn pages/oversikt sin html, samt kjøre js fil oversikt.js.

**Due to limitations of the current implementation, it is important that the instance of this website is hsoted on a web-server and that the content root is the same directory as this directory! For example, the files `index.html`, `login.html`, `register.html` should be accessible in the following manner, respectively:**

- `https://example.com/index.html`
- `https://example.com/login.html`
- `https://example.com/register.html`
