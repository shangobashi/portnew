import { cp, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Plugin } from 'vite';

export function copyApiRoutes(): Plugin {
  const sourceDir = resolve(__dirname, '../src/app/api');

  return {
    name: 'copy-api-routes',
    apply: 'build',
    async writeBundle(options) {
      if (!options.dir) {
        return;
      }

      if (!existsSync(sourceDir)) {
        return;
      }

      const buildRoot = options.dir.includes('/assets')
        ? resolve(options.dir, '..')
        : options.dir;
      const destinationDir = resolve(buildRoot, 'src/app/api');

      await mkdir(destinationDir, { recursive: true });
      await cp(sourceDir, destinationDir, { recursive: true });
    },
  };
}
