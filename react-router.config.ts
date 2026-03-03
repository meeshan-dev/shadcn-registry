import type { Config } from '@react-router/dev/config';
import { vercelPreset } from '@vercel/react-router/vite';
import { createGetUrl, getSlugs } from 'fumadocs-core/source';
import { glob } from 'node:fs/promises';

const getUrl = createGetUrl('/docs');

export default {
  // Config options...
  // Server-side render by default, to enable SPA mode set this to `false`
  ssr: true,
  presets: [vercelPreset()],
  future: {
    // v8_middleware: true,
    v8_splitRouteModules: true,
    v8_viteEnvironmentApi: true,
  },
  async prerender({ getStaticPaths }) {
    const paths: string[] = [];
    const excluded: string[] = ['/api/search'];

    for (const path of getStaticPaths()) {
      if (!excluded.includes(path)) paths.push(path);
    }

    for await (const entry of glob('**/*.mdx', { cwd: 'content/docs' })) {
      const slugs = getSlugs(entry);

      paths.push(getUrl(slugs));
    }

    return [...new Set(paths)];
  },
} satisfies Config;
