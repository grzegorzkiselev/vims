import { TextEditorCursorStyle, window } from "vscode";
import { Configuration } from "../Configuration";

export class ActionBlockCursor {

  static getCursor = (cursor, activeTextEditor) => {
    switch (cursor) {
      case "block":
        activeTextEditor.options.cursorStyle = TextEditorCursorStyle.Block;
        break;
      case "line":
        activeTextEditor.options.cursorStyle = TextEditorCursorStyle.Line;
        break;
      case "underline":
        activeTextEditor.options.cursorStyle = TextEditorCursorStyle.Underline;
        break;
      case "line-thin":
        activeTextEditor.options.cursorStyle = TextEditorCursorStyle.LineThin;
        break;
      case "block-outline":
        activeTextEditor.options.cursorStyle = TextEditorCursorStyle.BlockOutline;
        break;
      case "underline-thin":
        activeTextEditor.options.cursorStyle = TextEditorCursorStyle.UnderlineThin;
        break;
      default:
        activeTextEditor.options.cursorStyle = TextEditorCursorStyle.Block;
    }
  };

  static on(): Thenable<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const activeTextEditor = window.activeTextEditor;

        if (!activeTextEditor) {
          return Promise.resolve(false);
        }

        ActionBlockCursor.getCursor(Configuration.cursorStyle, activeTextEditor);

        resolve(true);
      }, 0);
    });
  }

  static off(): Thenable<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const activeTextEditor = window.activeTextEditor;

        if (!activeTextEditor) {
          return Promise.resolve(false);
        }

        ActionBlockCursor.getCursor(Configuration.userPrefferedCursorStyle, activeTextEditor);

        resolve(true);
      }, 0);
    });
  }
}
