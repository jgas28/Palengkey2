// Runs after `cap sync` / `cap copy` (Capacitor's capacitor:*:after hooks).
// ios/ is git-ignored, so the splash images live in resources/ios-splash and
// are copied into the Xcode project here.
const fs = require("fs");
const path = require("path");

const platform = process.env.CAPACITOR_PLATFORM_NAME;
if (platform && platform !== "ios") process.exit(0);

const root = path.resolve(__dirname, "..");
const src = path.join(root, "resources", "ios-splash", "Splash.imageset");
const dest = path.join(root, "ios", "App", "App", "Assets.xcassets", "Splash.imageset");

if (!fs.existsSync(path.dirname(dest))) process.exit(0); // no iOS project here

fs.rmSync(dest, { recursive: true, force: true });
fs.cpSync(src, dest, { recursive: true });
console.log("[splash] Copied iOS splash images into", path.relative(root, dest));
