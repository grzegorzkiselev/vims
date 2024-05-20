import { window, TextDocument, Position } from "vscode";
import { Motion } from "./Motion";

enum Direction {
  Prev,
  PrevWithSameIndentation,
  Next,
  NextWithSameIndentation,
  NextIndentationLevelDown,
  NextIndentationLevelUp,
  PreviousIndentationLevelDown,
  PreviousIndentationLevelUp
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
      direction: Direction.PrevWithSameIndentation,
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
      direction: Direction.NextWithSameIndentation,
      n: args.n,
    });
  }

  static nextIndentationLevelDown(args: { n?: number }): Motion {
    return new MotionParagraph({
      direction: Direction.NextIndentationLevelDown,
      n: args.n,
    });
  }

  static nextIndentationLevelUp(args: { n?: number }): Motion {
    return new MotionParagraph({
      direction: Direction.NextIndentationLevelUp,
      n: args.n,
    });
  }

  static previousIndentationLevelUp(args: { n?: number }): Motion {
    return new MotionParagraph({
      direction: Direction.PreviousIndentationLevelUp,
      n: args.n,
    });
  }

  static previousIndentationLevelDown(args: { n?: number }): Motion {
    return new MotionParagraph({
      direction: Direction.PreviousIndentationLevelDown,
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
    // Skip first group of empty lines if currently on empty line.
    const { shouldSkip, currentIndentation } = MotionParagraph.getCurrentIndentation(document, from.line);

    const loopProperties = this.getLoopProperties({ from, document });

    const { toCharacter, shouldStop, toLine } = this.findLine({
      document,
      currentIndentation,
      shouldSkip,
      ...loopProperties
    });

    return {
      to: new Position(toLine, toCharacter || 0),
      shouldStop: shouldStop,
    };
  }

  private findLine({
    document,
    currentIndentation,
    shouldSkip,
    conditionalI,
    stopCondition,
    indexUpdater,
    lineCondition,
    lineResolver,
  }) {
    let shouldStop = true;
    let toCharacter;
    let toLine;

    for (let i = conditionalI; stopCondition(i); indexUpdater === "inc" ? i++ : i--) {
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
      ({ shouldStop, toLine, toCharacter } = lineResolver());
    }

    return { toCharacter, shouldStop, toLine };
  }

  private getLoopProperties({
    from,
    document
  }) {
    let conditionalI,
      toLine,
      toCharacter,
      shouldStop,
      stopCondition,
      indexUpdater,
      lineResolver,
      lineCondition;

    const toStart = () => {
      return {
        shouldStop: true,
        toLine: 0,
      };
    };

    const toEnd = () => {
      const toLine = document.lineCount - 1;
      return {
        shouldStop: true,
        toLine,
        toCharacter: document.lineAt(toLine).text.length,
      };
    };

    const toStayInPlace = () => {
      return {
        shouldStop: true,
        toLine: from.line,
      };
    };

    if (this.direction === Direction.Prev
      || this.direction === Direction.PrevWithSameIndentation
      || this.direction === Direction.PreviousIndentationLevelUp
      || this.direction === Direction.NextIndentationLevelUp
    ) {
      conditionalI = from.line - 1;
      stopCondition = (i) => i >= 0;
      lineResolver = toStart;
      lineCondition = MotionParagraph.isLineEmpty;
      indexUpdater = "dec";
    } else if (
      this.direction === Direction.Next
      || this.direction === Direction.NextWithSameIndentation
      || this.direction === Direction.NextIndentationLevelDown
      || this.direction === Direction.PreviousIndentationLevelDown
    ) {
      conditionalI = from.line + 1;
      stopCondition = (i) => i < document.lineCount;
      lineResolver = toEnd;
      lineCondition = MotionParagraph.isLineEmpty;
      indexUpdater = "inc";
    }

    if (this.direction === Direction.PrevWithSameIndentation
      || this.direction === Direction.NextWithSameIndentation
      || this.direction === Direction.PreviousIndentationLevelUp
      || this.direction === Direction.PreviousIndentationLevelDown
      || this.direction === Direction.NextIndentationLevelUp
      || this.direction === Direction.NextIndentationLevelDown
    ) {
      lineCondition = MotionParagraph.isIndentationMatch;
      lineResolver = toStayInPlace;
    }

    if (this.direction === Direction.NextIndentationLevelUp
      || this.direction === Direction.NextIndentationLevelDown
    ) {
      lineCondition = (document, line, indentation) => MotionParagraph.isIndentationMatch(document, line, `${indentation + 1},`);
    }

    if (this.direction === Direction.PreviousIndentationLevelUp
      || this.direction === Direction.PreviousIndentationLevelDown
    ) {
      lineCondition = (document, line, indentation) => MotionParagraph.isIndentationMatch(document, line, `0,${indentation - 1}`);
    }

    return {
      conditionalI,
      shouldStop,
      toLine,
      toCharacter,
      stopCondition,
      lineResolver,
      lineCondition,
      indexUpdater
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

  private static isIndentationMatch(document: TextDocument, line: number, indentation: string): boolean {
    const tester = new RegExp(`^[\\s|\\t]{${indentation}}[^\\s\\t]`);
    return tester.test(document.lineAt(line).text);
  }
}
