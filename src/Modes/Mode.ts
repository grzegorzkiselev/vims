import { Disposable, QuickPick, QuickPickItem, commands, window } from "vscode";
import { Configuration } from "../Configuration";
import { StaticReflect } from "../LanguageExtensions/StaticReflect";
import { CommandMap, CommandMapper } from "../Mappers/Command";
import { MatchResultKind } from "../Mappers/Generic";
import { SymbolMetadata } from "../Symbols/Metadata";

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

  protected qp = (
    Configuration.useQuickPick
      ? window.createQuickPick() as QuickPick<QuickPickItem> & { isOpen: boolean, currentListener: Disposable }
      : null as never
  );
  protected suggestions: { keys: string, details: string }[] = [];

  enter(): void {
    this.updateStatusBar();
    // this.qp.onDidChangeValue(this.updateQuickPick);

    if (this.qp) {
      this.qp.isOpen = false;
      this.qp.title = "VimS";
      this.qp.ignoreFocusOut = true;
      this.qp.onDidHide(this.hideQuickPick);
      this.qp.items = this.suggestions.map(({ keys, details }) => {
        return {
          label: keys.replace(/\s+/g, ""),
          detail: details
        };
      });
    }
  }

  private updateStatusBar(message?: string): void {
    let status = `-- ${this.name} --`;

    if (message) {
      status += ` ${message}`;
    }

    window.setStatusBarMessage(status);
  }

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

  showQuickPick = (value) => {
    this.qp.isOpen = true;
    this.qp.show();
    this.qp.value = value;
    this.qp.currentListener = this.qp.onDidChangeValue(this.updateQuickPick);
    // this.qp.items = this.suggestions.map(({ keys, details }) => {
    //   return {
    //     label: keys.replace(/\s+/g, ""),
    //     detail: details
    //   };
    // });
  };

  hideQuickPick = () => {
    this.qp.isOpen = false;
    this.qp.currentListener?.dispose();
    this.qp.value = "";
    this.qp.hide();
    this.reduceInput({ kind: 0, map: null });
  };

  updateQuickPickItems = (pattern: RegExp | string = "", replacement = "") => {
    this.qp.items = this.suggestions.map(({ keys, details }) => {
      return {
        label: keys.replace(pattern, replacement).replace(/\s+/g, ""),
        detail: details
      };
    });
  };

  updateQuickPick = () => {
    const isDigit = new RegExp("(\\d+)");
    const matches = this.qp.value.match(isDigit);
    const numberId = "{N}";

    if (matches != null && matches?.length > 0) {
      this.updateQuickPickItems(numberId, matches[0]);
    } else {
      this.updateQuickPickItems(isDigit, numberId);
    }

    this.inputs = [...this.qp.value];

    const { kind, map } = this.mapper.match(this.inputs);
    this.reduceInput({ kind, map });
  };

  // extractField = (node, property): unknown => {
  //   const condition = typeof node[property] !== "undefined" || node == null;

  //   if (condition) {
  //     return Array.isArray(node[property]) ? node[property] : [node[property]];
  //   }

  //   return Object.values(node).map((node) => {
  //     if (!condition) {
  //       return this.extractField(node, property);
  //     }
  //     return node[property];
  //   });
  // };

  reduceInput = ({ kind, map }) => {
    if (kind === MatchResultKind.FAILED) {
      if (this.qp && this.qp.isOpen) {
        this.hideQuickPick();
      }
      this.updateStatusBar();
      this.clearInputs();
    } else if (kind === MatchResultKind.FOUND) {
      if (this.qp && this.qp.isOpen) {
        this.hideQuickPick();
      }
      this.updateStatusBar();
      this.clearInputs();
      this.pushCommandMap(map!);
      this.execute();
    } else if (kind === MatchResultKind.WAITING) {
      this.updateStatusBar(`${this.inputs.join(" ")} and...`);
      commands.executeCommand("setContext", "vims.waitingForInput", true);

      if (this.qp && !this.qp.isOpen) {
        this.showQuickPick(this.inputs[0]);
      }
    }
  };

  input(key: string, args: {} = {}): MatchResultKind {
    let inputs: string[];

    if (key === "escape") {
      inputs = [key];
    } else {
      this.inputs.push(key);
      inputs = this.inputs;
    }

    const { kind, map } = this.mapper.match(inputs);

    this.reduceInput({ kind, map });

    return kind;
  }

  // quickPickInput = () => {
  //   const expandedKeys = Object.values(this.mapper.specialKeys).reduce((resultArray, specialKey) => {
  //     const accessor = node[specialKey.indicator];
  //     const safeindicator = specialKey.indicator.replace(/({|})/g, "\\$1");

  //     if (accessor) {
  //       let inputStringArray = this.extractField(accessor, "keys");
  //       if (!Array.isArray(inputStringArray)) {
  //         inputStringArray = [inputStringArray];
  //       }

  //       inputStringArray.forEach((inputString) => {
  //         let workingString = inputString;
  //         const isDigit = new RegExp("(\\d+)");
  //         const matches = this.qp.value.match(isDigit);

  //         if (matches != null && matches?.length > 0) {
  //           workingString = workingString.replace("{N}", matches[0]);
  //         }

  //         if (specialKey.maps?.length > 0) {
  //           const reg = new RegExp(safeindicator);

  //           resultArray.push(...specialKey.maps.map(({ keys }) => {
  //             return workingString.replace(reg, keys);
  //           }));
  //         } else {
  //           resultArray.push(workingString);
  //         }
  //       });

  //       // else {
  //       //   const isDigit = new RegExp("(\\d+)");
  //       //   const matches = this.qp.value.match(isDigit);
  //       //   console.log(matches);
  //       //   if (matches != null && matches?.length > 0) {
  //       //     inputString = inputString.replace("{N}", matches[0]);
  //       //   }

  //       // if (specialKey.maps?.length > 0) {
  //       //   const reg = new RegExp(safeindicator);

  //       //   resultArray.push(...specialKey.maps.map(({ keys }) => {
  //       //     return inputString.replace(reg, keys);
  //       //   }));
  //       // }
  //       // else {
  //       // resultArray.push(inputString);
  //       // }
  //     }
  //     // }
  //     return resultArray;
  //   }, []);

  //   console.log(expandedKeys);

  //   this.qp.items = expandedKeys.flat().map((key) => {
  //     return { label: key.replace(/\s+/, "") };
  //   });
  // };

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
