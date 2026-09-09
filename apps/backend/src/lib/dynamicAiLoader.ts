import path from 'node:path';
import { pathToFileURL } from 'node:url';
import fs from 'node:fs';

// Use dynamic import so TypeScript compiler does not inspect or try to compile external AI files
const dynamicImport = (url: string) => import(/* @vite-ignore */ url);

export async function loadAiModule(subpath: string): Promise<any> {
  // Resolve base directory of the repository
  const currentDir = process.cwd();
  const repoRoot = currentDir.endsWith('backend') || currentDir.endsWith('apps')
    ? path.resolve(currentDir, currentDir.endsWith('backend') ? '../..' : '..')
    : currentDir;

  const targetBase = path.resolve(repoRoot, 'ai', subpath);

  const candidates = [
    targetBase + '.ts',
    targetBase + '.js',
    path.join(targetBase, 'index.ts'),
    path.join(targetBase, 'index.js'),
    targetBase,
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      try {
        const fileUrl = pathToFileURL(candidate).href;
        const mod = await dynamicImport(fileUrl);
        if (mod) return mod;
      } catch (err: any) {
        // continue
      }
    }
  }

  return null;
}
