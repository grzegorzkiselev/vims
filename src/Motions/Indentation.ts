import { TextDocument } from "vscode";
import { Motion } from "./Motion";
import { IParagraphArgs, MotionParagraph, StaticArgs } from "./Paragraph";

export enum IndentationDirection {
  PrevWithSameIndentation,
  NextWithSameIndentation,
  NextIndentationLevelDown,
  NextIndentationLevelUp,
  PreviousIndentationLevelUp,
  PreviousIndentationLevelDown,
}

export class MotionIndentation extends MotionParagraph {

  private static toStayInPlace = (from) => {
    return {
      shouldStop: true,
      toLine: from.line,
    };
  };

  private static commonProperties = {
    lineCondition: MotionIndentation.isIndentationMatch,
    lineResolver: MotionIndentation.toStayInPlace,
  };

  private static nextIndentationLineCondition = (document, line, indentation) => {
    const result = MotionIndentation.isIndentationMatch(document, line, `${indentation + 1},`);

    if (!result.isAcceptableLine) {
      const { currentIndentation: candidateIndentation } = MotionParagraph.getCurrentIndentation(document, line);

      if (candidateIndentation < indentation) {
        result.shouldBreak = true;
      }
    }

    return result;
  };

  private static previousIndentationLineCondition = (document, line, indentation) => {
    return MotionIndentation.isIndentationMatch(document, line, `0,${indentation - 1}`);
  };

  constructor({ direction, n = 1, isSelection = false, isMulticursor = false, directionProperties }: IParagraphArgs) {
    super({ direction, n, isSelection, isMulticursor, directionProperties });
  }

  static previousWithSameIndentation({ n, isSelection, isMulticursor }: StaticArgs): Motion {
    return new MotionIndentation({
      direction: IndentationDirection.PrevWithSameIndentation,
      n: n,
      isSelection,
      isMulticursor,
      directionProperties: {
        ...MotionIndentation.upDirection,
        ...MotionIndentation.commonProperties,
      }
    });
  }

  static nextWithSameIndentation({ n, isSelection, isMulticursor }: StaticArgs): Motion {
    return new MotionIndentation({
      direction: IndentationDirection.NextWithSameIndentation,
      n: n,
      isSelection: isSelection,
      isMulticursor: isMulticursor,
      directionProperties: {
        ...MotionIndentation.downDirection,
        ...MotionIndentation.commonProperties,
      }
    });
  }

  static nextIndentationLevelDown({ n, isSelection, isMulticursor }: StaticArgs): Motion {
    return new MotionIndentation({
      direction: IndentationDirection.NextIndentationLevelDown,
      n: n,
      isSelection: isSelection,
      isMulticursor: isMulticursor,
      directionProperties: {
        ...MotionIndentation.downDirection,
        ...MotionIndentation.commonProperties,
        lineCondition: MotionIndentation.nextIndentationLineCondition,
      }
    });
  }

  static nextIndentationLevelUp({ n, isSelection, isMulticursor }: StaticArgs): Motion {
    return new MotionIndentation({
      direction: IndentationDirection.NextIndentationLevelUp,
      n: n,
      isSelection: isSelection,
      isMulticursor: isMulticursor,
      directionProperties: {
        ...MotionIndentation.upDirection,
        ...MotionIndentation.commonProperties,
        lineCondition: MotionIndentation.nextIndentationLineCondition,
      }
    });
  }

  static previousIndentationLevelUp({ n, isSelection, isMulticursor }: StaticArgs): Motion {
    return new MotionIndentation({
      direction: IndentationDirection.PreviousIndentationLevelUp,
      n: n,
      isSelection: isSelection,
      isMulticursor: isMulticursor,
      directionProperties: {
        ...MotionIndentation.upDirection,
        ...MotionIndentation.commonProperties,
        lineCondition: MotionIndentation.previousIndentationLineCondition,
      }
    });
  }

  static previousIndentationLevelDown({ n, isSelection, isMulticursor }: StaticArgs): Motion {
    return new MotionIndentation({
      direction: IndentationDirection.PreviousIndentationLevelDown,
      n: n,
      isSelection: isSelection,
      isMulticursor: isMulticursor,
      directionProperties: {
        ...MotionIndentation.downDirection,
        ...MotionIndentation.commonProperties,
        lineCondition: MotionIndentation.previousIndentationLineCondition,
      }
    });
  }

  private static isIndentationMatch(document: TextDocument, line: number, indentation: string) {
    const tester = new RegExp(`^[\\s|\\t]{${indentation}}[^\\s\\t]`);
    return {
      isAcceptableLine: tester.test(document.lineAt(line).text),
      shouldBreak: false,
    };
  }
}
