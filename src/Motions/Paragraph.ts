import { window, TextDocument, Position } from "vscode";
import { Motion } from "./Motion";
import { IndentationDirection } from "./Indentation";

export enum Direction {
  Prev,
  Next,
}

interface ILineResolver {
  shouldStop?: boolean,
  toLine?: number,
  toCharacter?: number,
}

interface IDirectionProperties {
  initialI: (from: unknown) => number,
  stopCondition: (i: number, document?: TextDocument) => boolean,
  loopDirection: "up" | "down",
  lineCondition: (document: TextDocument, line: number, currentIndentation: string) => { isAcceptableLine: boolean, shouldBreak: boolean },
  lineResolver: ({ document }: { document?: TextDocument }) => ILineResolver,
}

export interface IParagraphArgs {
  direction: Direction | IndentationDirection,
  n?: number,
  directionProperties: IDirectionProperties,
  isSelection: boolean,
  isMulticursor: boolean,
}

export type StaticArgs = Omit<IParagraphArgs, "direction">

export class MotionParagraph extends Motion {
  protected direction: Direction | IndentationDirection;
  protected n: number;
  protected initialI;
  protected stopCondition;
  protected loopDirection;
  protected lineCondition;
  protected lineResolver;
  public isSelection;
  public isMulticursor;

  protected static toStart = () => {
    return {
      shouldStop: true,
      toLine: 0,
    };
  };

  protected static toEnd = ({ document }) => {
    const toLine = document.lineCount - 1;
    return {
      shouldStop: true,
      toLine,
      toCharacter: document.lineAt(toLine).text.length,
    };
  };

  protected static upDirection = {
    initialI: (from) => from.line - 1,
    stopCondition: (i) => i >= 0,
    loopDirection: "up" as const,
    lineResolver: MotionParagraph.toStart,
    lineCondition: MotionParagraph.isLineEmpty,
  };

  protected static downDirection = {
    initialI: (from) => from.line + 1,
    stopCondition: (i, document) => i < document.lineCount,
    loopDirection: "down" as const,
    lineResolver: MotionParagraph.toEnd,
    lineCondition: MotionParagraph.isLineEmpty,
  };

  constructor({ direction, n = 1, directionProperties, isSelection, isMulticursor }: IParagraphArgs) {
    super();

    this.direction = direction;
    this.n = n;
    this.isSelection = isSelection;
    this.isMulticursor = isMulticursor;
    this.initialI = directionProperties.initialI;
    this.stopCondition = directionProperties.stopCondition;
    this.loopDirection = directionProperties.loopDirection;
    this.lineResolver = directionProperties.lineResolver;
    this.lineCondition = directionProperties.lineCondition;
  }

  static prev({ n, isSelection, isMulticursor }: StaticArgs): Motion {
    return new MotionParagraph({
      direction: Direction.Prev,
      n: n,
      isSelection,
      isMulticursor,
      directionProperties: MotionParagraph.upDirection,
    });
  }

  static next({ n, isSelection, isMulticursor }: StaticArgs): Motion {
    return new MotionParagraph({
      direction: Direction.Next,
      n: n,
      isSelection,
      isMulticursor,
      directionProperties: MotionParagraph.downDirection,
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

    // const loopProperties = this.getLoopProperties({ from, document });

    const { toCharacter, shouldStop, toLine } = this.findLine({
      document,
      currentIndentation,
      shouldSkip,
      from
      // ...loopProperties
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
    from
  }) {
    let shouldStop = true;
    let toCharacter;
    let toLine;

    for (let i = this.initialI(from); this.stopCondition(i, document); this.loopDirection === "down" ? i++ : i--) {
      const { shouldBreak, isAcceptableLine } = this.lineCondition(document, i, currentIndentation);

      if (shouldBreak) {
        break;
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
      ({ shouldStop, toLine, toCharacter } = this.lineResolver({ document }));
    }

    return { toCharacter, shouldStop, toLine };
  }

  private static isLineEmpty(document: TextDocument, line: number) {
    return {
      isAcceptableLine: document.lineAt(line).text === "",
      shouldBreak: false
    };
  }

  protected static getCurrentIndentation(document: TextDocument, line: number): { shouldSkip: boolean, currentIndentation: number } {
    return {
      shouldSkip: document.lineAt(line).text === "",
      currentIndentation: document.lineAt(line).text.match(/^([\s|\t]*)/)?.[0].length || 0
    };
  }
}
