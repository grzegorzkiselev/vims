import { ActionBlockCursor } from "../Actions/BlockCursor";
import { ActionCase } from "../Actions/Case";
import { ActionCommandLine } from "../Actions/CommandLine";
import { ActionDelete } from "../Actions/Delete";
import { ActionFilter } from "../Actions/Filter";
import { ActionFind } from "../Actions/Find";
import { ActionInsert } from "../Actions/Insert";
import { ActionJoinLines } from "../Actions/JoinLines";
import { ActionMode } from "../Actions/Mode";
import { ActionMoveCursor } from "../Actions/MoveCursor";
import { ActionNativeEscape } from "../Actions/NativeEscape";
import { ActionRegister } from "../Actions/Register";
import { ActionRelativeLineNumbers } from "../Actions/RelativeLineNumbers";
import { ActionReplace } from "../Actions/Replace";
import { ActionSelection } from "../Actions/Selection";
import { Configuration } from "../Configuration";
import { StaticReflect } from "../LanguageExtensions/StaticReflect";
import { CommandMap } from "../Mappers/Command";
import { SpecialKeyCommon } from "../Mappers/SpecialKeys/Common";
import { MotionCharacter } from "../Motions/Character";
import { MotionLine } from "../Motions/Line";
import { SymbolMetadata } from "../Symbols/Metadata";
import { Mode, ModeID } from "./Mode";

export class ModeNormal extends Mode {
  id = ModeID.NORMAL;
  name = "NORMAL";

  private maps: CommandMap[] = [
    {
      keys: "{motion}",
      actions: [ActionMoveCursor.byMotions],
      args: { noEmptyAtLineEnd: true },
    },
    {
      keys: "{N} {motion}",
      actions: [ActionMoveCursor.byMotions],
      args: { noEmptyAtLineEnd: true },
    },
    {
      keys: "{*motion}",
      actions: [ActionMoveCursor.byMotions],
      args: { noEmptyAtLineEnd: true },
    },
    {
      keys: "{N} {*motion}",
      actions: [ActionMoveCursor.byMotions],
      args: { noEmptyAtLineEnd: true },
    },

    // { keys: "ctrl+b", actions: [ActionPage.up] },
    // { keys: "ctrl+f", actions: [ActionPage.down] },

    { keys: "i", actions: [ActionMode.toInsert] },
    {
      keys: "I",
      actions: [
        () =>
          ActionMoveCursor.byMotions({
            motions: [MotionLine.firstNonBlank()],
          }),
        ActionMode.toInsert,
      ],
    },
    {
      keys: "a",
      actions: [
        () =>
          ActionMoveCursor.byMotions({
            motions: [MotionCharacter.right()],
          }),
        ActionMode.toInsert,
      ],
    },
    {
      keys: "A",
      actions: [
        () => ActionMoveCursor.byMotions({ motions: [MotionLine.end()] }),
        ActionMode.toInsert,
      ],
    },

    {
      keys: "o",
      actions: [ActionInsert.newLineAfter, ActionMode.toInsert],
    },
    {
      keys: "O",
      actions: [ActionInsert.newLineBefore, ActionMode.toInsert],
    },

    {
      keys: "s",
      actions: [ActionDelete.selectionsOrRight, ActionMode.toInsert],
      args: {
        shouldYank: true,
      },
      details: "Delete [count] characters [into register x] and start insert (s stands for Substitute)."
    },
    {
      keys: "X",
      actions: [ActionDelete.selectionsOrLeft],
      args: { shouldYank: true },
      details: `Delete [count] characters before the cursor [into register x] (not |linewise|).  Does the same as "dh". Also see |'whichwrap'|.`
    },
    {
      keys: "backspace",
      actions: [ActionDelete.selectionsOrLeft],
      args: { shouldYank: true },
      details: `Delete [count] characters before the cursor [into register x] (not |linewise|).  Does the same as "dh". Also see |'whichwrap'|.`
    },
    {
      keys: "{N} X",
      actions: [ActionDelete.selectionsOrLeft],
      args: { shouldYank: true },
    },
    {
      keys: "{N} backspace",
      actions: [ActionDelete.selectionsOrLeft],
      args: { shouldYank: true },
    },
    {
      keys: "x",
      actions: [ActionDelete.selectionsOrRight, ActionSelection.validateSelections],
      args: {
        shouldYank: true,
      },
      details: `Delete [count] characters under and after the cursor [into register x] (not |linewise|).  Does the same as "dl".`
    },
    {
      keys: "{N} x",
      actions: [ActionDelete.selectionsOrRight, ActionSelection.validateSelections],
      args: {
        shouldYank: true,
      },
    },
    {
      keys: "delete",
      actions: [ActionDelete.selectionsOrRight, ActionSelection.validateSelections],
      args: {
        shouldYank: true,
      },
    },
    {
      keys: "d d",
      actions: [ActionDelete.byLines],
      args: { shouldYank: true },
    },
    {
      keys: "{N} d d",
      actions: [ActionDelete.byLines],
      args: { shouldYank: true },
      details: `Delete [count] lines [into register x] |linewise|.`
    },
    {
      keys: "d {N} d",
      actions: [ActionDelete.byLines],
      args: { shouldYank: true },
    },
    {
      keys: "D",
      actions: [ActionDelete.byMotions, ActionSelection.validateSelections],
      args: {
        motions: [MotionLine.end()],
        shouldYank: true,
      },
      details: `Delete the characters under the cursor until the end of the line and [count]-1 more lines [into register x]; synonym for "d$". (not |linewise|)`
    },
    {
      keys: "d {motion}",
      actions: [ActionDelete.byMotions, ActionSelection.validateSelections],
      args: {
        shouldYank: true,
      },
    },
    {
      keys: "d {N} {motion}",
      actions: [ActionDelete.byMotions, ActionSelection.validateSelections],
      args: {
        shouldYank: true,
      },
    },
    {
      keys: "{N} d {motion}",
      actions: [ActionDelete.byMotions, ActionSelection.validateSelections],
      args: {
        shouldYank: true,
      },
    },
    {
      keys: "d {textObject}",
      actions: [ActionDelete.byTextObject, ActionSelection.validateSelections],
      args: {
        shouldYank: true,
      },
    },
    {
      keys: "C",
      actions: [ActionDelete.byMotions, ActionMode.toInsert],
      args: {
        motions: [MotionLine.end()],
        shouldYank: true,
      },
      details: "Delete from the cursor position to the end of the line and [count]-1 more lines [into register x], and start insert."
    },
    {
      keys: "c c",
      actions: [
        () =>
          ActionMoveCursor.byMotions({
            motions: [MotionLine.firstNonBlank()],
          }),
        ActionDelete.byMotions,
        ActionMode.toInsert,
      ],
      args: {
        motions: [MotionLine.end()],
        shouldYank: true,
      },
      details: "Delete [count] lines [into register x] and start insert |linewise|.  If 'autoindent' is on, preserve the indent of the first line."
    },
    {
      keys: "S",
      actions: [
        () =>
          ActionMoveCursor.byMotions({
            motions: [MotionLine.firstNonBlank()],
          }),
        ActionDelete.byMotions,
        ActionMode.toInsert,
      ],
      args: {
        motions: [MotionLine.end()],
        shouldYank: true,
      },
      details: 'Delete [count] lines [into register x] and start insert.  Synonym for cc" |linewise|.'
    },
    {
      keys: "c {motion}",
      actions: [ActionDelete.byMotions, ActionMode.toInsert],
      args: {
        shouldYank: true,
        isChangeAction: true,
      },
    },
    {
      keys: "c {N} {motion}",
      actions: [ActionDelete.byMotions, ActionMode.toInsert],
      args: {
        shouldYank: true,
        isChangeAction: true,
      },
    },
    {
      keys: "c {textObject}",
      actions: [ActionDelete.byTextObject, ActionMode.toInsert],
      args: {
        shouldYank: true,
      },
      details: "Change"
    },
    {
      keys: "J", actions: [ActionJoinLines.onSelections],
      details: `Join [count] lines, with a minimum of two lines. Remove the indent and insert up to two spaces (see below).`
    },

    {
      keys: "r {char}", actions: [ActionReplace.charactersWithCharacter],
      details: `Replace the character under the cursor with {char}.`
    },
    { keys: "{N} r {char}", actions: [ActionReplace.charactersWithCharacter] },
    {
      keys: "R", actions: [ActionMode.toReplace],
      details: "Enter Replace mode: Each character you type replaces an existing character, starting with the character under the cursor.Repeat the entered text [count]-1 times."
    },

    {
      keys: "~",
      actions: [
        ActionCase.switchActives,
        () =>
          ActionMoveCursor.byMotions({
            motions: [MotionCharacter.right()],
          }),
      ],
    },
    {
      keys: "{N} ~",
      actions: [
        ActionCase.switchActives,
        (n) =>
          ActionMoveCursor.byMotions({
            motions: [MotionCharacter.right(n)],
          }),
      ],
      details: `'notildeop' option: Switch case of the character under the cursor and move the cursor to the right. If a [count] is given, do that many characters. {Vi: no count}`
    },

    {
      keys: "y y", actions: [ActionRegister.yankLines],
      details: `Yank [count] lines [into register x] |linewise|.`
    },
    { keys: "{N} y y", actions: [ActionRegister.yankLines] },
    { keys: "y {N} y", actions: [ActionRegister.yankLines] },
    {
      keys: "Y", actions: [ActionRegister.yankLines],
      details: `yank [count] lines [into register x] (synonym for yy, |linewise|).  If you like "Y" to work from the cursor to the end of line (which is more logical, but not Vi-compatible) use ":map Y y$".`
    },
    { keys: "y {motion}", actions: [ActionRegister.yankByMotions] },
    {
      keys: "y {N} {motion}", actions: [ActionRegister.yankByMotions],
      details: `Yank {motion} text [into register x].  When no characters are to be yanked (e.g., "y0" in column 1), this is an error when 'cpoptions' includes the 'E' flag.`
    },
    { keys: "y {textObject}", actions: [ActionRegister.yankByTextObject] },
    {
      keys: "p", actions: [ActionRegister.putAfter],
      details: `Put the text [from register x] after the cursor [count] times.  {Vi: no count}`
    },
    { keys: "{N} p", actions: [ActionRegister.putAfter] },
    {
      keys: "P", actions: [ActionRegister.putBefore],
      details: `Put the text [from register x] before the cursor [count] times.  {Vi: no count}`
    },
    { keys: "{N} P", actions: [ActionRegister.putBefore] },

    { keys: "n", actions: [ActionFind.next] },
    { keys: "N", actions: [ActionFind.prev] },
    { keys: "*", actions: [ActionFind.byIndicator, ActionFind.next] },
    { keys: "#", actions: [ActionFind.byIndicator, ActionFind.prev] },

    {
      keys: "= {motion}", actions: [ActionFilter.Format.byMotions],
      details: `Filter {motion} lines through the external program given with the 'equalprg' option.  When the 'equalprg' option is empty (this is the default), use the internal formatting function |C-indenting|.  But when 'indentexpr' is not empty, it will be used instead |indent-expression|.  When Vim was compiled without internal formatting then the "indent" program is used as a last resort.`
    },
    { keys: "= {N} {motion}", actions: [ActionFilter.Format.byMotions] },
    // {
    //   keys: "= =", actions: [ActionFilter.Format.byCursors],
    //   details: `Filter [count] lines like with ={motion}.`
    // },

    // {
    //   keys: "u",
    //   actions: [ActionHistory.undo, ActionSelection.validateSelections],
    // },
    // {
    //   keys: "ctrl+r",
    //   actions: [ActionHistory.redo, ActionSelection.validateSelections],
    // },

    // {
    //   keys: "< <", actions: [ActionIndent.decrease],
    //   details: "Shift [count] lines one 'shiftwidth' leftwards."
    // },
    // {
    //   keys: "> >", actions: [ActionIndent.increase],
    //   details: "Shift [count] lines one 'shiftwidth' rightwards."
    // },

    { keys: "/", actions: [ActionFind.focusFindWidget] },

    { keys: "v", actions: [ActionMode.toVisual] },
    { keys: "V", actions: [ActionMode.toVisualLine] },
    // {
    //   keys: "z up",
    //   actions: [ActionScroll.scrollLineUp],
    // },
    // {
    //   keys: "{N} z up",
    //   actions: [ActionScroll.scrollLineUp],
    // },
    // {
    //   keys: "z z",
    //   actions: [ActionReveal.primaryCursor],
    //   args: { revealType: TextEditorRevealType.InCenter },
    // },
    // { keys: "z c", actions: [ActionFold.fold] },
    // { keys: "z o", actions: [ActionFold.unfold] },
    // { keys: "z M", actions: [ActionFold.foldAll] },
    // { keys: "z R", actions: [ActionFold.unfoldAll] },

    { keys: ":", actions: [ActionCommandLine.promptAndRun] },

    // { keys: ".", actions: [this.repeatRecordedCommandMaps.bind(this)] },

    // {
    //   keys: "ctrl+c",
    //   actions: [ActionNativeEscape.press, ActionSelection.shrinkToPrimaryActive],
    // },
    // {
    //   keys: "ctrl+[",
    //   actions: [ActionNativeEscape.press, ActionSelection.shrinkToPrimaryActive],
    // },
    {
      keys: "escape",
      actions: [ActionNativeEscape.press, ActionSelection.shrinkToPrimaryActive],
    },
  ];

  constructor() {
    super();

    this.maps.forEach((map) => {
      this.mapper.map(map.keys, map.actions, map.args);

      if (this.quickPick) {
        this.generateSuggestions(map);
      }
    });
  }

  generateSuggestions(map) {
    // selecting special keys to remap
    const toGenerate = this.mapper.specialKeys.slice(1, 3) as SpecialKeyCommon[];

    toGenerate.forEach((specialKey) => {
      const regexp = new RegExp(specialKey.indicator.replace(/\{([a-zA-Z])\}/, "\\{$1\\}"));
      if (regexp.test(map.keys)) {
        specialKey.suggestions?.forEach((suggestion) => {
          this.quickPick.addSuggestion({ keys: map.keys.replace(regexp, suggestion), details: map.details || "empty" });
        });
      }
    });
  }

  enter(): void {
    super.enter();

    ActionBlockCursor.on();

    if (Configuration.smartRelativeLineNumbers) {
      ActionRelativeLineNumbers.on();
    }
  }

  exit(): void {
    super.exit();

    ActionBlockCursor.off();
  }

  private _recordedCommandMaps: CommandMap[];
  get recordedCommandMaps() {
    return this._recordedCommandMaps;
  }

  protected onWillCommandMapMakesChanges(map: CommandMap): void {
    if (map.isRepeating) {
      return;
    }

    const actions = map.actions.filter((action) => {
      return (
        StaticReflect.getMetadata(SymbolMetadata.Action.shouldSkipOnRepeat, action) !== true
      );
    });

    this._recordedCommandMaps = [
      {
        keys: map.keys,
        actions: actions,
        args: map.args,
        isRepeating: true,
      },
    ];
  }

  onDidRecordFinish(recordedCommandMaps: CommandMap[], lastModeID: ModeID): void {
    if (!recordedCommandMaps || recordedCommandMaps.length === 0) {
      return;
    }

    if (lastModeID === ModeID.INSERT || lastModeID === ModeID.REPLACE) {
      recordedCommandMaps.forEach((map) => (map.isRepeating = true));

      if (this._recordedCommandMaps === undefined) {
        this._recordedCommandMaps = recordedCommandMaps;
      } else {
        this._recordedCommandMaps = this._recordedCommandMaps.concat(recordedCommandMaps);
      }
    } else {
      this._recordedCommandMaps = recordedCommandMaps;
    }
  }

  // private repeatRecordedCommandMaps(): Thenable<boolean> {
  //   if (this._recordedCommandMaps === undefined) {
  //     return Promise.resolve(false);
  //   }

  //   // TODO: Replace `args.n` if provided

  //   this._recordedCommandMaps.forEach((map) => this.pushCommandMap(map));
  //   this.pushCommandMap({
  //     keys: "escape",
  //     actions: [ActionNativeEscape.press],
  //   });
  //   this.execute();

  //   return Promise.resolve(true);
  // }
}
