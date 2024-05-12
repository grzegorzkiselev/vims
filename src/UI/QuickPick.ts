import { Disposable, QuickPick, QuickPickItem, commands, window } from "vscode";
import { Configuration } from "../Configuration";

type Suggestion = { keys: string, details: string, alwaysShow?: boolean }

export class SuggestionsList {
  protected ru: string = "фисвуапршолдьтщзйкыегмцчняФИСВУАПРШОЛДЬТЩЗЙКЫЕГМЦЧНЯбхБХ;':,.<§±>?#жэю@";
  protected en: string = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ[]{};':,.<§±>?#$ˆ&@";
  public ignoreInput = false;
  public isOpen: boolean = false;
  public enabled: boolean = true;
  public currentListener: Disposable;
  public quickPick: QuickPick<QuickPickItem> | never;

  constructor() {
    this.revalidateConfig();
  }

  public suggestions: Suggestion[] = [];
  protected preparedSuggestions: Suggestion[] = [];
  protected suggestionsReducer: ({ suggestion, pattern, replacement }: { suggestion: Suggestion, pattern?: RegExp | string, replacement?: string }) => Suggestion;
  protected suggestionsReducerList: Array<typeof this.suggestionsReducer> = [];

  revalidateConfig = () => {
    this.quickPick = (
      Configuration.useQuickPick
        ? window.createQuickPick() as QuickPick<QuickPickItem> & { isOpen: boolean, currentListener: Disposable }
        : null as never
    );
    this.enabled = Configuration.useQuickPick;
    this.revalidateQuickPick();
  };

  private revalidateQuickPick = () => {
    if (this.quickPick) {
      this.isOpen = false;
      this.quickPick.title = "VimS";
      this.quickPick.ignoreFocusOut = true;
      this.quickPick.onDidHide(this.hideQuickPick);
      this.preparedSuggestions = this.suggestions;
      this.quickPick.items = this.suggestions.map(({ keys, details }) => {
        return {
          label: keys.replace(/\s+/g, ""),
          detail: details
        };
      });
    }
  };

  addSuggestion = (suggestion: Suggestion) => {
    this.suggestions.push(suggestion);
  };

  private mapLang(char, from, to) {
    const position = from.indexOf(char);
    if (position >= 0) {
      return to[position];
    }
    return false;
  }

  showQuickPick = () => {
    this.isOpen = true;
    this.quickPick.show();
    commands.executeCommand("workbench.action.focusActiveEditorGroup");

    this.resetPreparedSuggestions();
    this.currentListener = this.quickPick.onDidChangeValue(this.quickPickListener);
  };

  hideQuickPick = () => {
    this.isOpen = false;
    this.currentListener?.dispose();
    this.quickPick.value = "";
    this.quickPick.hide();

    // this.reduceInput({ kind: 0, map: null });
  };

  // forceFilterQuickPickItems: typeof this.suggestionsReducer = ({ suggestion }: { suggestion: Suggestion }): Suggestion | false => {
  //   const acceptableString = this.inputs.every((char) => {
  //     return suggestion.keys.includes(char);
  //   });

  //   if (acceptableString === true) {
  //     return { keys: suggestion.keys, details: suggestion.details, alwaysShow: true };
  //   }

  //   return false;
  // };

  private updateQuickPickItems: typeof this.suggestionsReducer = ({ suggestion, pattern, replacement }) => {
    if (!pattern || !replacement) {
      return suggestion;
    }
    return {
      ...suggestion,
      keys: suggestion.keys.replace(pattern, replacement),
    };
  };

  private applyQuickPickItems = (args) => {
    this.quickPick.items = this.preparedSuggestions.reduce((result, suggestion) => {
      this.suggestionsReducerList.forEach((reducer) => {
        suggestion = reducer({ suggestion, ...args });
      });

      result.push({
        label: suggestion.keys.replace(/\s+/g, ""),
        detail: suggestion.details,
        alwaysShow: suggestion.alwaysShow || false
      });

      return result;
    }, [] as QuickPickItem[]);
  };

  private resetPreparedSuggestions = () => {
    this.preparedSuggestions = [...this.suggestions];
  };

  // translateInput = (value) => {
  // this.ignoreInput = true;
  // this.quickPick.value = value;
  // this.ignoreInput = false;
  // };

  private quickPickListener = (value) => {
    if (this.ignoreInput) {
      return;
    }

    const localInputs = this.matchLanguage(value);


    this.updateQuickPickValue(localInputs, true);

    const args = this.matchNumbers(this.quickPick.value);

    // const { kind, map } = this.mapper.match(this.inputs);
    // this.reduceInput({ kind, map });

    this.applyQuickPickItems(args);
    this.resetPreparedSuggestions();
  };

  updateQuickPick = (inputs: string) => {
    this.matchLanguage(inputs);


    this.updateQuickPickValue(inputs);

    const args = this.matchNumbers(this.quickPick.value);

    // const { kind, map } = this.mapper.match(this.inputs);
    // this.reduceInput({ kind, map });

    this.applyQuickPickItems(args);
    this.resetPreparedSuggestions();
  };

  private updateQuickPickValue(localInputs: string, ignoreListener = false) {
    this.ignoreInput = ignoreListener;
    this.quickPick.value = localInputs;
    this.ignoreInput = false;
  }

  private matchNumbers(value: string) {
    const isDigit = new RegExp("(\\d+)");
    const matches = value.match(isDigit);
    const numberId = "{N}";

    const args = { pattern: "", replacement: "" };
    if (matches != null && matches?.length > 0) {
      this.suggestionsReducerList.push(this.updateQuickPickItems);
      args.pattern = numberId;
      args.replacement = matches[0];
      // this.updateQuickPickItems(numberId, matches[0]);
    }
    return args;
  }

  private matchLanguage(value: string) {
    const localInputs = value;
    const lastInput = localInputs.at(-1);
    const remappedLastInput = this.mapLang(lastInput, this.ru, this.en);

    if (remappedLastInput) {
      return localInputs.substring(0, localInputs.length - 1) + remappedLastInput;
    }
    return localInputs;
  }
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
  //         const matches = this.quickPick.value.match(isDigit);

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
  //       //   const matches = this.quickPick.value.match(isDigit);
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

  //   this.quickPick.items = expandedKeys.flat().map((key) => {
  //     return { label: key.replace(/\s+/, "") };
  //   });
  // };
}
