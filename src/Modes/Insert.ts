import { Position, TextEditor, window } from "vscode";
import { Action } from "../Actions/Action";
import { ActionBlockCursor } from "../Actions/BlockCursor";
import { ActionDelete } from "../Actions/Delete";
import { ActionInsert } from "../Actions/Insert";
import { ActionMoveCursor } from "../Actions/MoveCursor";
import { ActionRelativeLineNumbers } from "../Actions/RelativeLineNumbers";
import { Configuration } from "../Configuration";
import { CommandMap } from "../Mappers/Command";
import { MatchResultKind } from "../Mappers/Generic";
import { MotionCharacter } from "../Motions/Character";
import { Mode, ModeID } from "./Mode";

export class ModeInsert extends Mode {
  id = ModeID.INSERT;
  name = "INSERT";

  private maps: CommandMap[] = [
    // {
    //   keys: "ctrl+w",
    //   actions: [
    //     () =>
    //       ActionDelete.byMotions({
    //         motions: [MotionWord.prevStart()],
    //       }),
    //   ],
    // },
    // {
    //   keys: "ctrl+u",
    //   actions: [
    //     () =>
    //       ActionDelete.byMotions({
    //         motions: [MotionLine.firstNonBlank()],
    //       }),
    //   ],
    // },

    // {
    //   keys: "ctrl+c",
    //   actions: [
    //     ActionNativeEscape.press,
    //     () =>
    //       ActionSelection.shrinkToActives().then((isShrunken) =>
    //         isShrunken ? Promise.resolve(true) : ActionMode.toNormal(),
    //       ),
    //   ],
    // },
    // {
    //   keys: "ctrl+[",
    //   actions: [
    //     ActionNativeEscape.press,
    //     () =>
    //       ActionSelection.shrinkToActives().then((isShrunken) =>
    //         isShrunken ? Promise.resolve(true) : ActionMode.toNormal(),
    //       ),
    //   ],
    // },
    // {
    //   keys: "escape",
    //   actions: [
    //     ActionNativeEscape.press,
    //     () =>
    //       ActionSelection.shrinkToActives().then((isShrunken) =>
    //         isShrunken ? Promise.resolve(true) : ActionMode.toNormal(),
    //       ),
    //   ],
    // },
    {
      keys: "{*motion}",
      actions: [ActionMoveCursor.byMotions],
      args: { noEmptyAtLineEnd: true, isSelection: true },
    },
  ];

  constructor(private textAtSelections: Action = ActionInsert.textAtSelections) {
    super();

    this.maps.forEach((map) => {
      this.mapper.map(map.keys, map.actions, map.args);
    });
  }

  private textEditor?: TextEditor;

  enter(): void {
    super.enter();

    this.textEditor = window.activeTextEditor;

    // this.startRecord();
    ActionBlockCursor.off();

    if (Configuration.smartRelativeLineNumbers) {
      ActionRelativeLineNumbers.off();
    }
  }

  exit(): void {
    super.exit();

    this.endRecord();

    if (this.textEditor === window.activeTextEditor) {
      ActionMoveCursor.byMotions({ motions: [MotionCharacter.left()] });
    }
  }

  input(key: string, args: { replaceCharCnt?: number } = {}): MatchResultKind {
    const matchResultKind = super.input(key);

    // Pass key to built-in command if match failed.
    if (matchResultKind !== MatchResultKind.FAILED) {
      return matchResultKind;
    }

    this.startRecord();

    this.pushCommandMap({
      keys: key,
      actions: [this.textAtSelections],
      args: {
        text: key,
        replaceCharCnt: args.replaceCharCnt,
      },
    });
    this.execute();

    return MatchResultKind.FOUND;
  }

  private isRecording: boolean = false;
  private recordStartPosition: Position;
  private recordStartLineText: string;

  private _recordedCommandMaps: CommandMap[];
  get recordedCommandMaps() {
    return this._recordedCommandMaps;
  }

  private startRecord(): void {
    if (this.isRecording) {
      return;
    }

    if (!this.textEditor) {
      return;
    }

    this.isRecording = true;
    this.recordStartPosition = this.textEditor.selection.active;
    this.recordStartLineText = this.textEditor.document.lineAt(
      this.recordStartPosition.line,
    ).text;
    this._recordedCommandMaps = [];
  }

  private processRecord(): void {
    if (!this.textEditor) {
      return;
    }

    const currentLineText = this.textEditor.document.lineAt(this.recordStartPosition.line).text;

    let deletionCountBefore = 0;
    let deletionCountAfter = 0;

    let searchLimit: number;

    // Calculate deletion count before.
    searchLimit = Math.min(this.recordStartPosition.character, this.recordStartLineText.length);
    for (let i = 0; i < searchLimit; i++) {
      if (currentLineText.length <= i || currentLineText[i] !== this.recordStartLineText[i]) {
        deletionCountBefore = this.recordStartPosition.character - i;
        break;
      }
    }

    // Calculate deletion count after;
    const minIndex = this.recordStartPosition.character - deletionCountBefore;
    searchLimit = this.recordStartLineText.length - this.recordStartPosition.character + 1;
    for (let i = 1; i < searchLimit; i++) {
      const originalIndex = this.recordStartLineText.length - i;
      const currentIndex = currentLineText.length - i;

      if (
        currentIndex < minIndex ||
        currentLineText[currentIndex] !== this.recordStartLineText[originalIndex]
      ) {
        deletionCountAfter = searchLimit - i;
        break;
      }
    }

    const inputText = currentLineText.substring(
      this.recordStartPosition.character - deletionCountBefore,
      currentLineText.length -
      (this.recordStartLineText.length -
        this.recordStartPosition.character -
        deletionCountAfter),
    );

    if (deletionCountBefore > 0) {
      this._recordedCommandMaps.push({
        keys: "",
        actions: [
          () =>
            ActionDelete.byMotions({
              motions: [
                MotionCharacter.left({
                  n: deletionCountBefore,
                }),
              ],
            }),
        ],
        isRepeating: true,
      });
    }

    if (inputText.length > 0) {
      this._recordedCommandMaps.push({
        keys: "",
        actions: [ActionInsert.textAtSelections],
        args: {
          text: inputText,
        },
        isRepeating: true,
      });
    }

    if (deletionCountAfter > 0) {
      this._recordedCommandMaps.push(
        {
          keys: "",
          actions: [
            () =>
              ActionDelete.byMotions({
                motions: [
                  MotionCharacter.right({
                    n: deletionCountAfter,
                  }),
                ],
              }),
          ],
          isRepeating: true,
        },
        {
          keys: "",
          actions: [
            () =>
              ActionMoveCursor.byMotions({
                motions: [
                  MotionCharacter.left({
                    n: deletionCountAfter - 1,
                  }),
                ],
              }),
          ],
          isRepeating: true,
        },
      );
    }
  }

  private endRecord(): void {
    if (!this.isRecording) {
      return;
    }

    this.isRecording = false;

    this.processRecord();
  }

  protected onWillCommandMapMakesChanges(map: CommandMap): void {
    if (!this.isRecording) {
      return;
    }

    if (map.keys === "\n") {
      this.processRecord();
      this._recordedCommandMaps.push({
        keys: "enter",
        actions: [ActionInsert.textAtSelections],
        args: {
          text: "\n",
        },
        isRepeating: true,
      });
    }
  }

  protected onDidCommandMapMakesChanges(map: CommandMap): void {
    if (!this.isRecording) {
      return;
    }

    if (map.keys === "\n") {
      if (!this.textEditor) {
        return;
      }

      this.recordStartPosition = this.textEditor.selection.active;
      this.recordStartLineText = this.textEditor.document.lineAt(
        this.recordStartPosition.line,
      ).text;
    }
  }

  onDidChangeTextEditorSelection(): void {
    if (!this.textEditor) {
      return;
    }

    if (this.textEditor.selection.active.line !== this.recordStartPosition.line) {
      this.endRecord();
    }
  }
}
