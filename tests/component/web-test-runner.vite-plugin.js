/* Autor: Prof. Dr. Norman Lahme-Hütig (FH Münster) */

import { createServer } from 'vite';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const cssMap = new Map();

const litCssPlugins = [
  {
    name: 'vite-plugin-lit-css-pre',
    transform(code, id) {
      if (id.includes('/components/') && (id.endsWith('.css?inline') || id.endsWith('.css?used&inline'))) {
        cssMap.set(id, code);
      }
      return code;
    }
  },
  {
    name: 'vite-plugin-lit-css-post',
    enforce: 'post',
    transform(code, id) {
      if (cssMap.has(id)) {
        const css = cssMap.get(id);
        cssMap.delete(id);
        return `import {css} from 'lit'; export default css\`${css}\`;`;
      }
    }
  }
];

const nodeModulesResolverPlugin = {
  name: 'wtr-node-modules-resolver',
  resolveId(id) {
    if (id.startsWith('.') || id.startsWith('/') || id.startsWith('\0')) return null;
    try {
      return { id: require.resolve(id), external: false };
    } catch {
      return null;
    }
  }
};

export default function (viteRoot, filesToWatch) {
  let server;

  return {
    name: 'wtr-vite-plugin',

    async serverStart({ app, fileWatcher }) {
      filesToWatch.forEach(entry => fileWatcher.add(entry));
      server = await createServer({
        root: viteRoot,
        resolve: { dedupe: ['lit', '@lit/reactive-element', 'lit-html', 'lit-element'] },
        plugins: [nodeModulesResolverPlugin, ...litCssPlugins],
        server: { middlewareMode: true }
      });
      app.use((ctx, next) => new Promise(() => server.middlewares(ctx.req, ctx.res, next)));
    },

    async serverStop() {
      return server.close();
    }
  };
}
