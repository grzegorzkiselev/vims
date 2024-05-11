import fs from "fs";
import path from "path";

import("../Shortcuts/Shortcuts.js").then((module) => {
  const { exportShortcuts } = module;
  const filePath = String(path.resolve(__dirname, "../../package.json"));
  const rawpackage = require(filePath);

  rawpackage.contributes.keybindings = exportShortcuts;
  fs.writeFileSync(filePath, JSON.stringify(rawpackage, null, 2));
  console.log("Shortcuts Updated! :)");
});
