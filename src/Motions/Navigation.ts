import { commands, window, Position } from "vscode";
import { Motion } from "./Motion";

export class MotionNavigation extends Motion {
  private command: string;
  private number?: number;

  static toDeclaration(): Motion {
    const obj = new MotionNavigation({ isLinewise: true });
    obj.command = "editor.action.goToDeclaration";
    return obj;
  }

  static toParentFold(args: { n: number }): Motion {
    const obj = new MotionNavigation({ isLinewise: true });
    obj.command = "editor.gotoParentFold";
    obj.number = args.n;
    return obj;
  }

  static toTypeDefinition(): Motion {
    const obj = new MotionNavigation({ isLinewise: true });
    obj.command = "editor.action.goToTypeDefinition";
    return obj;
  }

  async apply(from: Position): Promise<Position> {
    from = await super.apply(from);

    const activeTextEditor = window.activeTextEditor;

    if (!activeTextEditor) {
      return from;
    }

    do {
      await commands.executeCommand(this.command);
    } while (this.number && --this.number);

    return activeTextEditor.selection.active;
  }
}
