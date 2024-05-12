import { Disposable, ExtensionContext, commands, window, workspace } from "vscode";
import { ActionFind } from "./Actions/Find";
import { ActionMode } from "./Actions/Mode";
import { ActionMoveCursor } from "./Actions/MoveCursor";
import { ActionNativeEscape } from "./Actions/NativeEscape";
import { ActionSelection } from "./Actions/Selection";
import { Configuration } from "./Configuration";
import { ModeInsert } from "./Modes/Insert";
import { Mode, ModeID } from "./Modes/Mode";
import { ModeNormal } from "./Modes/Normal";
import { ModeReplace } from "./Modes/Replace";
import { ModeVisual } from "./Modes/Visual";
import { ModeVisualLine } from "./Modes/VisualLine";
import { vscodeCommands } from "./Shortcuts/Shortcuts";

export class Dispatcher {
  public _currentMode: Mode;
  get currentMode(): Mode {
    return this._currentMode;
  }
  key?: string;
  ActionMode;
  ActionNativeEscape;
  ActionSelection;

  private modes: { [k: string]: Mode } = {
    [ModeID.NORMAL]: new ModeNormal(),
    [ModeID.VISUAL]: new ModeVisual(),
    [ModeID.VISUAL_LINE]: new ModeVisualLine(),
    [ModeID.INSERT]: new ModeInsert(),
    [ModeID.REPLACE]: new ModeReplace(),
  };

  private disposables: Disposable[] = [];

  constructor(context: ExtensionContext) {
    this.ActionMode = ActionMode;
    this.ActionNativeEscape = ActionNativeEscape;
    this.ActionSelection = ActionSelection;

    Object.keys(this.modes).forEach((key) => {
      const mode = this.modes[key];
      context.subscriptions.push(
        commands.registerCommand(`vims.mode.${mode.id}`, () => {
          this.switchMode(mode.id);
        }),
      );
    });

    vscodeCommands.forEach(({ command, action }) => {
      try {
        commands.registerCommand(command, action, this);
      } catch (error) {
        console.log("chill");
      }
    });

    context.subscriptions.push(
      commands.registerCommand("type", (args) => {
        this.inputHandler(args.text)();
      }),
    );

    context.subscriptions.push(
      commands.registerCommand("replacePreviousChar", (args) => {
        this.inputHandler(args.text, {
          replaceCharCnt: args.replaceCharCnt,
        })();
      }),
    );

    // Keys.raws.forEach((key) => {
    //     context.subscriptions.push(
    //         commands.registerCommand(`vims.${key}`, this.inputHandler(key)),
    //     );
    // });

    context.subscriptions.push(
      commands.registerCommand("vims.executeNativeFind", ActionFind.executeNativeFind),
    );

    commands.registerCommand("vims.toggleUseQuickPick", Configuration.toggleQuickPick);

    ActionMoveCursor.updatePreferredColumn();

    this.switchMode(Configuration.defaultModeID);

    this.disposables.push(
      window.onDidChangeTextEditorSelection(() => {
        // Ensure this is executed after all pending commands.
        setTimeout(async () => {
          await ActionMode.switchByActiveSelections(this._currentMode.id);
          ActionMoveCursor.updatePreferredColumn();
          this._currentMode.onDidChangeTextEditorSelection();
        }, 2);
      }),
      window.onDidChangeActiveTextEditor(async () => {
        if (Configuration.defaultModeID === ModeID.INSERT) {
          await ActionMode.toInsert();
        } else {
          // Passing `null` to `currentMode` to force mode switch.
          await ActionMode.switchByActiveSelections(null);
        }
        ActionMoveCursor.updatePreferredColumn();
      }),
      workspace.onDidChangeConfiguration(() => {
        this._currentMode.quickPick.revalidateConfig();
      }),
    );

    commands.executeCommand("setContext", "vims.isLoaded", true);
  }

  private inputHandler(key: string, args: {} = {}): () => void {
    return () => {
      this._currentMode.input(key);
    };
  }

  private switchMode(id: ModeID): void {
    const lastMode = this._currentMode;

    if (lastMode) {
      lastMode.exit();
    }

    this._currentMode = this.modes[id];
    this._currentMode.enter();

    // in order not to break existing configs, we export REPLACE as INSERT
    commands.executeCommand(
      "setContext",
      "vims.mode",
      this._currentMode === this.modes[ModeID.REPLACE]
        ? this.modes[ModeID.INSERT].name
        : this._currentMode.name,
    );

    // For use in repeat command
    if (lastMode) {
      this._currentMode.onDidRecordFinish(lastMode.recordedCommandMaps, lastMode.id);
    }
  }

  dispose(): void {
    Disposable.from(...this.disposables).dispose();

    Object.keys(this.modes).forEach((id) => {
      this.modes[id].dispose();
    });
  }
}
