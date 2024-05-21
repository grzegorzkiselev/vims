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

type Args = {
  direction: Direction,
  n?: number,
  isSelectionAllowed?: boolean,
  multicursor?: boolean
}

type StaticArgs = Omit<Args, "direction">

export class MotionParagraph extends Motion {
  private direction: Direction;
  private n: number;
  readonly isSelectionAllowed: boolean;
  readonly multicursor: boolean;

  constructor({ direction, n = 1, isSelectionAllowed = false, multicursor = false }: Args) {
    super();

    this.direction = direction;
    this.n = n;
    this.isSelectionAllowed = isSelectionAllowed;
    this.multicursor = multicursor;
  }

  static prev({ n, isSelectionAllowed, multicursor }: StaticArgs): Motion {
    return new MotionParagraph({
      direction: Direction.Prev,
      n: n,
      isSelectionAllowed: isSelectionAllowed,
      multicursor: multicursor,
    });
  }

  static prevWithIndentation({ n, isSelectionAllowed, multicursor }: StaticArgs): Motion {
    return new MotionParagraph({
      direction: Direction.PrevWithSameIndentation,
      n: n,
      isSelectionAllowed: isSelectionAllowed,
      multicursor: multicursor,
    });
  }

  static next({ n, isSelectionAllowed, multicursor }: StaticArgs): Motion {
    return new MotionParagraph({
      direction: Direction.Next,
      n: n,
      isSelectionAllowed: isSelectionAllowed,
      multicursor: multicursor,
    });
  }

  static nextWithIndentation({ n, isSelectionAllowed, multicursor }: StaticArgs): Motion {
    return new MotionParagraph({
      direction: Direction.NextWithSameIndentation,
      n: n,
      isSelectionAllowed: isSelectionAllowed,
      multicursor: multicursor,
    });
  }

  static nextIndentationLevelDown({ n, isSelectionAllowed, multicursor }: StaticArgs): Motion {
    return new MotionParagraph({
      direction: Direction.NextIndentationLevelDown,
      n: n,
      isSelectionAllowed: isSelectionAllowed,
      multicursor: multicursor,
    });
  }

  static nextIndentationLevelUp({ n, isSelectionAllowed, multicursor }: StaticArgs): Motion {
    return new MotionParagraph({
      direction: Direction.NextIndentationLevelUp,
      n: n,
      isSelectionAllowed: isSelectionAllowed,
      multicursor: multicursor,
    });
  }

  static previousIndentationLevelUp({ n, isSelectionAllowed, multicursor }: StaticArgs): Motion {
    return new MotionParagraph({
      direction: Direction.PreviousIndentationLevelUp,
      n: n,
      isSelectionAllowed: isSelectionAllowed,
      multicursor: multicursor,
    });
  }

  static previousIndentationLevelDown({ n, isSelectionAllowed, multicursor }: StaticArgs): Motion {
    return new MotionParagraph({
      direction: Direction.PreviousIndentationLevelDown,
      n: n,
      isSelectionAllowed: isSelectionAllowed,
      multicursor: multicursor,
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
    loopDirection,
    lineCondition,
    lineResolver,
  }) {
    let shouldStop = true;
    let toCharacter;
    let toLine;

    for (let i = conditionalI; stopCondition(i); loopDirection === "down" ? i++ : i--) {
      const isAcceptableLine = lineCondition(document, i, currentIndentation);

      if (!isAcceptableLine
        && (
          this.direction === Direction.NextIndentationLevelUp
          || this.direction === Direction.NextIndentationLevelDown
        )) {
        const { currentIndentation: candidateIndentation } = MotionParagraph.getCurrentIndentation(document, i);

        if (candidateIndentation < currentIndentation) {
          break;
        }
      }

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
      loopDirection,
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
      loopDirection = "up";
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
      loopDirection = "down";
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
      loopDirection
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
