import type { Plugin } from 'vite';
import { generateFOUCScript, type IFOUCScriptConfig } from '@mks2508/shadcn-basecoat-theme-manager';

/**
 * Vite plugin that injects a FOUC-prevention `<script>` into the HTML `<head>`.
 *
 * The script is generated at build time from {@link generateFOUCScript} so it
 * always stays in sync with the core package.
 *
 * @param config - FOUC script configuration forwarded to `generateFOUCScript`.
 */
export function viteFOUCPlugin(config?: IFOUCScriptConfig): Plugin {
  const script = generateFOUCScript(config);

  return {
    name: 'vite-plugin-fouc-prevention',
    transformIndexHtml(html) {
      return html.replace(
        '<head>',
        `<head>\n    <script>${script}</script>`
      );
    },
  };
}
