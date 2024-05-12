import { commands } from "vscode";
import { StaticReflect } from "../LanguageExtensions/StaticReflect";
import { CommandMap, CommandMapper } from "../Mappers/Command";
import { MatchResultKind } from "../Mappers/Generic";
import { SymbolMetadata } from "../Symbols/Metadata";
import { SuggestionsList } from "../UI/QuickPick";
import { StatusBar } from "../UI/StatusBar";

export enum ModeID {
  NORMAL,
  VISUAL,
  VISUAL_LINE,
  INSERT,
  REPLACE,
}

export abstract class Mode {
  id: ModeID;
  name: string;

  private pendings: CommandMap[] = [];
  private executing: boolean = false;
  private inputs: string[] = [];
  protected mapper: CommandMapper = new CommandMapper();
  public quickPick = new SuggestionsList();

  enter(): void {
    this.updateStatusBar();

    this.quickPick.revalidateConfig();
  }

  updateStatusBar = (message?: string) => {
    let status = `-- ${this.name} --`;

    if (message) {
      status += ` ${message}`;
    }

    StatusBar.updateStatusBar(status);
  };
  exit(): void {
    this.clearInputs();
    this.clearPendings();
  }

  dispose(): void {
    this.exit();
  }

  private clearInputs(): void {
    this.inputs = [];
    commands.executeCommand("setContext", "vims.waitingForInput", false);
  }

  private clearPendings(): void {
    this.pendings = [];
  }

  reduceInput = ({ kind, map }) => {
    if (kind === MatchResultKind.FAILED) {
      this.updateStatusBar();
      this.clearInputs();
    } else if (kind === MatchResultKind.FOUND) {
      if (this.quickPick.enabled && this.quickPick.isOpen) {
        this.quickPick.hideQuickPick();
      }
      this.updateStatusBar();
      this.clearInputs();
      this.pushCommandMap(map!);
      this.execute();
    } else if (kind === MatchResultKind.WAITING) {
      this.updateStatusBar(`${this.inputs.join(" ")} and...`);
      commands.executeCommand("setContext", "vims.waitingForInput", true);

      if (this.quickPick.enabled && !this.quickPick.isOpen) {
        this.quickPick.showQuickPick();
      }
    }
  };

  input(key: string): MatchResultKind {
    let inputs: string[];

    if (key === "escape") {
      inputs = [key];
    } else {
      this.inputs.push(key);
      inputs = this.inputs;
    }

    const { kind, map } = this.mapper.match(inputs);

    this.reduceInput({ kind, map });

    if (this.quickPick.isOpen) {
      this.quickPick.updateQuickPick(this.inputs.join(""));
    }

    return kind;
  }

  protected pushCommandMap(map: CommandMap): void {
    this.pendings.push(map);
  }

  /**
     * Override this to return recorded command maps.
     */
  get recordedCommandMaps(): CommandMap[] {
    return [];
  }

  /**
     * Override this to do something before command map makes changes.
     */
  protected onWillCommandMapMakesChanges(map: CommandMap): void { }

  /**
     * Override this to do something after command map made changes.
     */
  protected onDidCommandMapMakesChanges(map: CommandMap): void { }

  /**
* Override this to do something after selection changes.
*/
  onDidChangeTextEditorSelection(): void { }

  /**
* Override this to do something after recording ends.
*/
  onDidRecordFinish(recordedCommandMaps: CommandMap[], lastModeID: ModeID): void { }


  // if (regTextObj.test(map.keys)) {
  //   this.mapper.specialKeys[2].suggestions?.forEach((chunk) => {
  //     this.quickPick.suggestions.push(
  //       { keys: map.keys.replace(regTextObj, chunk), details: map.details || "empty" }
  //     );
  //   });
  // }
  // const regMotion = new RegExp("\{motion\}");
  // if (regMotion.test(map.keys)) {
  //   this.mapper.specialKeys[1].suggestions?.forEach((chunk) => {
  //     this.quickPick.suggestions.push(
  //       { keys: map.keys.replace(regMotion, chunk), details: map.details || "empty" }
  //     );
  //   });
  // }
  // };

  protected execute(): void {
    if (this.executing) {
      return;
    }

    this.executing = true;

    const one = () => {
      const map = this.pendings.shift();

      if (!map) {
        this.executing = false;
        return;
      }

      let promise: Promise<boolean | undefined | void> = Promise.resolve(true);

      const isAnyActionIsChange = map.actions.some((action) => {
        return StaticReflect.getMetadata(SymbolMetadata.Action.isChange, action);
      });

      if (isAnyActionIsChange) {
        promise = promise.then(() => this.onWillCommandMapMakesChanges(map));
      }

      map.actions.forEach((action) => {
        promise = promise.then(() => action(map.args));
      });

      if (isAnyActionIsChange) {
        promise = promise.then(() => this.onDidCommandMapMakesChanges(map));
      }

      promise.then(one.bind(this), () => {
        this.clearPendings();
        this.executing = false;
      });
    };

    one();
  }
}
