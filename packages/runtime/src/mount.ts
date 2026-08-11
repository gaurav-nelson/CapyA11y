import { mkdirSync, writeFileSync, rmSync, readFileSync, existsSync, createReadStream } from "node:fs";
import { join, dirname, relative, resolve, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { createServer, type Server } from "node:http";
import * as esbuild from "esbuild";
import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
import { injectSourceAttributes } from "./inject-source.js";

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));

export interface MountedComponent {
  page: Page;
  browser: Browser;
  context: BrowserContext;
  relFile: string;
  cleanup: () => void;
}

function findPackageRoot(): string {
  // packages/runtime/dist -> packages/runtime
  return resolve(__dirname, "..");
}

async function bundleComponent(
  absFile: string,
  relFile: string,
  workDir: string,
): Promise<{ htmlPath: string; exportName: string }> {
  const original = readFileSync(absFile, "utf8");
  const injected = injectSourceAttributes(absFile, relFile, original);
  const entryPath = join(workDir, "component.tsx");
  writeFileSync(entryPath, injected.code, "utf8");

  const importLine = injected.isDefault
    ? `import Comp from "./component.tsx";`
    : `import { ${injected.exportName} as Comp } from "./component.tsx";`;

  const harness = `
import React from "react";
import { createRoot } from "react-dom/client";
${importLine}

const root = createRoot(document.getElementById("root")!);
root.render(React.createElement(Comp));
`;
  const harnessPath = join(workDir, "harness.tsx");
  writeFileSync(harnessPath, harness, "utf8");

  const outfile = join(workDir, "bundle.js");
  await esbuild.build({
    entryPoints: [harnessPath],
    bundle: true,
    outfile,
    format: "esm",
    platform: "browser",
    jsx: "automatic",
    loader: { ".tsx": "tsx", ".ts": "ts", ".jsx": "jsx", ".js": "js", ".css": "css" },
    absWorkingDir: workDir,
    nodePaths: [
      resolve(findPackageRoot(), "node_modules"),
      resolve(findPackageRoot(), "../../node_modules"),
      resolve(process.cwd(), "node_modules"),
    ],
    // Stub CSS from design systems so plain HTML/JSX fixtures still mount
    plugins: [
      {
        name: "stub-css",
        setup(build) {
          build.onLoad({ filter: /\.css$/ }, () => ({
            contents: "/* stubbed css */",
            loader: "js",
          }));
        },
      },
    ],
    logLevel: "silent",
  });

  const htmlPath = join(workDir, "index.html");
  writeFileSync(
    htmlPath,
    `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>CapyA11y runtime</title>
    <style>
      body { font-family: system-ui, sans-serif; margin: 16px; }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./bundle.js"></script>
  </body>
</html>`,
    "utf8",
  );

  return { htmlPath, exportName: injected.exportName };
}

function contentType(filePath: string): string {
  switch (extname(filePath)) {
    case ".html":
      return "text/html; charset=utf-8";
    case ".js":
      return "text/javascript; charset=utf-8";
    case ".css":
      return "text/css; charset=utf-8";
    default:
      return "application/octet-stream";
  }
}

function startStaticServer(rootDir: string): Promise<{ server: Server; port: number }> {
  return new Promise((resolvePromise, reject) => {
    const server = createServer((req, res) => {
      const urlPath = (req.url ?? "/").split("?")[0] || "/";
      const safe = urlPath === "/" ? "/index.html" : urlPath;
      const filePath = join(rootDir, decodeURIComponent(safe));
      if (!filePath.startsWith(rootDir) || !existsSync(filePath)) {
        res.writeHead(404);
        res.end("Not found");
        return;
      }
      res.writeHead(200, { "Content-Type": contentType(filePath) });
      createReadStream(filePath).pipe(res);
    });
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      if (!addr || typeof addr === "string") {
        reject(new Error("Failed to bind runtime static server"));
        return;
      }
      resolvePromise({ server, port: addr.port });
    });
  });
}

/** Mount a TSX/JSX component file in headless Chromium (CT-style isolation). */
export async function mountComponentFile(
  absFile: string,
  cwd = process.cwd(),
): Promise<MountedComponent> {
  const relFile = relative(cwd, absFile).replace(/\\/g, "/");
  const workDir = join(
    findPackageRoot(),
    ".runtime-tmp",
    `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
  mkdirSync(workDir, { recursive: true });

  let server: Server | undefined;
  try {
    await bundleComponent(absFile, relFile, workDir);
    const started = await startStaticServer(workDir);
    server = started.server;
    const browser = await chromium.launch({ headless: true });
    // @axe-core/playwright requires a BrowserContext (not browser.newPage())
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(`http://127.0.0.1:${started.port}/`, {
      waitUntil: "networkidle",
    });
    // Wait for React root to paint
    await page.waitForSelector("#root *", { timeout: 15_000 });
    await new Promise((r) => setTimeout(r, 50));

    return {
      page,
      browser,
      context,
      relFile,
      cleanup: () => {
        void context.close().finally(() => void browser.close());
        server?.close();
        try {
          rmSync(workDir, { recursive: true, force: true });
        } catch {
          /* ignore */
        }
      },
    };
  } catch (err) {
    server?.close();
    try {
      rmSync(workDir, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
    throw err;
  }
}

export function resolveTabbableBrowserPath(): string {
  const candidates = [
    require.resolve("tabbable/dist/index.umd.min.js"),
    require.resolve("tabbable/dist/index.umd.js"),
  ];
  for (const c of candidates) {
    if (existsSync(c)) return c;
  }
  // ESM fallback — inject via Function body in page
  return "";
}
