import { window, TextDocument, Position } from "vscode";
import { Motion } from "./Motion";

enum Direction {
  Prev,
  PrevWithIndentation,
  Next,
  NextWithIndentation,
}

export class MotionParagraph extends Motion {
  private direction: Direction;
  private n: number;

  constructor(args: { direction: Direction; n?: number }) {
    args.n = args.n === undefined ? 1 : args.n;

    super();

    this.direction = args.direction;
    this.n = args.n;
  }

  static prev(args: { n?: number }): Motion {
    return new MotionParagraph({
      direction: Direction.Prev,
      n: args.n,
    });
  }

  static prevWithIndentation(args: { n?: number }): Motion {
    return new MotionParagraph({
      direction: Direction.PrevWithIndentation,
      n: args.n,
    });
  }

  static next(args: { n?: number }): Motion {
    return new MotionParagraph({
      direction: Direction.Next,
      n: args.n,
    });
  }

  static nextWithIndentation(args: { n?: number }): Motion {
    return new MotionParagraph({
      direction: Direction.NextWithIndentation,
      n: args.n,
    });
  }

  async apply(from: Position): Promise<Position> {
    from = await super.apply(from);

    const activeTextEditor = window.activeTextEditor;

    if (!activeTextEditor || this.direction === undefined || this.n === undefined) {
      return from;
    }

    const document = activeTextEditor.document;

    for (let i = 0; i < this.n; i++) {
      const result = this.applyOnce(document, from);

      from = result.to;

      if (result.shouldStop) {
        break;
      }
    }

    return from;
  }

  private applyOnce(
    document: TextDocument,
    from: Position,
  ): {
    to: Position;
    shouldStop: boolean;
  } {
    let toLine: number | undefined = undefined;
    let toCharacter = 0;
    let shouldStop = false;

    // Skip first group of empty lines if currently on empty line.
    // let shouldSkip = MotionParagraph.isLineEmpty(document, from.line);
    let { shouldSkip, currentIndentation } = MotionParagraph.getCurrentIndentation(document, from.line);
    // let shouldSkip = MotionParagraph.isLineEmpty(document, from.line);

    let conditionalI, stopCondition, modifier, lineResolver, lineCondition;

    const toStart = () => {
      shouldStop = true;
      toLine = 0;
    };

    const toEnd = () => {
      shouldStop = true;
      toLine = document.lineCount - 1;
      toCharacter = document.lineAt(toLine).text.length;
    };

    const toStayInPlace = () => {
      shouldStop = true;
      toLine = from.line;
    const toPreviousWithSameIndentation = () => {
      this.direction = Direction.PrevWithSameIndentation;
      return {
        shouldRetry: true
      };
    };

    const toNextWithSameIndentation = () => {
      this.direction = Direction.NextWithSameIndentation;
      return {
        shouldRetry: true
      };
    };

    if (this.direction === Direction.Prev || this.direction === Direction.PrevWithIndentation) {
      conditionalI = from.line - 1;
      stopCondition = (i) => i >= 0;
      lineResolver = toStart;
      lineCondition = MotionParagraph.isLineEmpty;
      modifier = "dec";
    } else if (this.direction === Direction.Next || this.direction === Direction.NextWithIndentation) {
      conditionalI = from.line + 1;
      stopCondition = (i) => i < document.lineCount;
      lineResolver = toEnd;
      lineCondition = MotionParagraph.isLineEmpty;
      modifier = "inc";
    }

    if (this.direction === Direction.PrevWithIndentation) {
      lineCondition = MotionParagraph.isIndentationMatch;
      lineResolver = toStayInPlace;
    } else if (this.direction === Direction.NextWithIndentation) {
      lineCondition = MotionParagraph.isIndentationMatch;
      lineResolver = toStayInPlace;
    }

    for (let i = conditionalI; stopCondition(i); modifier === "inc" ? i++ : i--) {
      const isAcceptableLine = lineCondition(document, i, currentIndentation);

      if (shouldSkip) {
        if (!isAcceptableLine) {
          shouldSkip = false;
        }
        continue;
      }

      if (isAcceptableLine) {
        toLine = i;
        break;
      }
    }

    if (toLine === undefined) {
      lineResolver();
    }

    return {
      to: new Position(toLine!, toCharacter),
      shouldStop: shouldStop,
    };
  }

  private static isLineEmpty(document: TextDocument, line: number): boolean {
    return document.lineAt(line).text === "";
  }

  private static getCurrentIndentation(document: TextDocument, line: number): { shouldSkip: boolean, currentIndentation: number } {
    return {
      shouldSkip: document.lineAt(line).text === "",
      currentIndentation: document.lineAt(line).text.match(/^([\s|\t]*)/)?.[0].length || 0
    };
  }

  private static isIndentationMatch(document: TextDocument, line: number, indentation: number): boolean {
    const tester = new RegExp(`^[\\s|\\t]{${indentation}}[^\\s\\t]`);
    return tester.test(document.lineAt(line).text);
  }
}
