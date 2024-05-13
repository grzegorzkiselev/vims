import fs from "fs";
import path from "path";
import { vscodeCommands } from "../Shortcuts/Shortcuts";

const filePath = String(path.resolve(__dirname, "../../package.json"));
const rawpackage = require(filePath);

const definedCommands = vscodeCommands.map(({ key, command, when }) => {
  return { key, command, when };
});

rawpackage.contributes.keybindings = definedCommands;
fs.writeFileSync(filePath, JSON.stringify(rawpackage, null, 2));
console.log("Shortcuts Updated! :)");