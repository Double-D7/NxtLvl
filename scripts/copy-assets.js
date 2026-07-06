// Copies static renderer assets (HTML, CSS) into the dist folder so Electron
// can load them next to the compiled renderer JS.
const fs = require("fs");
const path = require("path");

const srcDir = path.join(__dirname, "..", "src", "renderer");
const outDir = path.join(__dirname, "..", "dist", "renderer");

fs.mkdirSync(outDir, { recursive: true });

for (const file of ["index.html", "styles.css"]) {
  const from = path.join(srcDir, file);
  const to = path.join(outDir, file);
  if (fs.existsSync(from)) {
    fs.copyFileSync(from, to);
    console.log(`copied ${file}`);
  }
}
