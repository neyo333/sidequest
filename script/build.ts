import { build } from "vite";
import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function buildApp() {
  try {
    console.log("🔨 Building frontend with Vite...");
    
    // Build frontend
    await build({
      root: path.resolve(__dirname, ".."),
      build: {
        outDir: "dist/public",
        emptyOutDir: true,
      },
    });

    console.log("✅ Frontend built successfully");

    console.log("🔨 Building server with esbuild...");
    
    // Build server
    execSync(
      `esbuild server/index.ts --bundle --platform=node --format=esm --outfile=dist/index.js --external:pg-native --external:better-sqlite3`,
      { stdio: "inherit" }
    );

    console.log("✅ Server built successfully");
    console.log("🎉 Build complete!");
  } catch (error) {
    console.error("❌ Build failed:", error);
    process.exit(1);
  }
}

buildApp();