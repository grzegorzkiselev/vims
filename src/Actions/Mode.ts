import { commands, window } from "vscode";
import { ActionSelection } from "../Actions/Selection";
import { StaticReflect } from "../LanguageExtensions/StaticReflect";
import { ModeID } from "../Modes/Mode";
import { SymbolMetadata } from "../Symbols/Metadata";

export class ActionMode {
  @StaticReflect.metadata(SymbolMetadata.Action.shouldSkipOnRepeat, true)
  static toNormal(): Thenable<boolean> {
    return commands
      .executeCommand(`vims.mode.${ModeID.NORMAL}`)
      .then(() => ActionSelection.validateSelections());
  }

  @StaticReflect.metadata(SymbolMetadata.Action.shouldSkipOnRepeat, true)
  static toVisual(): Thenable<boolean | undefined> {
    return commands.executeCommand(`vims.mode.${ModeID.VISUAL}`);
  }

  @StaticReflect.metadata(SymbolMetadata.Action.shouldSkipOnRepeat, true)
  static toVisualLine(): Thenable<boolean | undefined> {
    return commands.executeCommand(`vims.mode.${ModeID.VISUAL_LINE}`);
  }

  @StaticReflect.metadata(SymbolMetadata.Action.isChange, true)
  @StaticReflect.metadata(SymbolMetadata.Action.shouldSkipOnRepeat, true)
  static toInsert(): Thenable<boolean | undefined> {
    return commands.executeCommand(`vims.mode.${ModeID.INSERT}`);
  }

  @StaticReflect.metadata(SymbolMetadata.Action.isChange, true)
  @StaticReflect.metadata(SymbolMetadata.Action.shouldSkipOnRepeat, true)
  static toReplace(): Thenable<boolean | undefined> {
    return commands.executeCommand(`vims.mode.${ModeID.REPLACE}`);
  }

  static switchByActiveSelections(currentMode: ModeID | null): Thenable<boolean> {
    const activeTextEditor = window.activeTextEditor;

    if (!activeTextEditor) {
      return Promise.resolve(false);
    }

    if (currentMode === ModeID.INSERT || currentMode === ModeID.REPLACE) {
      return Promise.resolve(true);
    }

    const selections = activeTextEditor.selections;

    let mode: ModeID;

    if (selections.every((selection) => selection.isEmpty)) {
      mode = ModeID.NORMAL;
    } else {
      mode = ModeID.VISUAL;
    }

    if (mode === currentMode) {
      if (mode === ModeID.NORMAL) {
        return ActionSelection.validateSelections();
      } else {
        return Promise.resolve(true);
      }
    } else if (mode === ModeID.VISUAL && currentMode === ModeID.VISUAL_LINE) {
      return Promise.resolve(true);
    } else {
      return commands
        .executeCommand(`vims.mode.${mode}`)
        .then(() => ActionSelection.validateSelections());
    }
  }
}
