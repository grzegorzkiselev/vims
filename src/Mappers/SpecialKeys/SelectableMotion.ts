import { MotionLine } from "../../Motions/Line";
import { Motion } from "../../Motions/Motion";
import { MotionParagraph } from "../../Motions/Paragraph";
import { GenericMap, GenericMapper, MatchResultKind, RecursiveMap } from "../Generic";
import { SpecialKeyChar } from "./Char";
import { SpecialKeyCommon, SpecialKeyMatchResult } from "./Common";
import { SpecialKeyN } from "./N";

interface MotionGenerator {
  (args?: {}): Motion;
}

interface MotionMap extends GenericMap {
  motionGenerators: MotionGenerator[];
}

export class SpecialKeySelectableMotion extends GenericMapper implements SpecialKeyCommon {
  indicator = "{shift+motion}";

  private conflictRegExp = /^[0]|\{char\}$/;

  private maps: MotionMap[] = [
    { keys: "shift+q", motionGenerators: [MotionParagraph.prev] },
    { keys: "shift+Q", motionGenerators: [MotionParagraph.next] },
    { keys: "shift+«", motionGenerators: [MotionParagraph.prevWithIndentation, MotionLine.firstNonBlank] },
    { keys: "shift+»", motionGenerators: [MotionParagraph.nextWithIndentation, MotionLine.firstNonBlank] },
    { keys: "shift+“", motionGenerators: [MotionParagraph.nextIndentationLevelDown, MotionLine.firstNonBlank] },
    { keys: "shift+„", motionGenerators: [MotionParagraph.previousIndentationLevelUp, MotionLine.firstNonBlank] },
    { keys: "shift+‘", motionGenerators: [MotionParagraph.nextIndentationLevelUp, MotionLine.firstNonBlank] },
    { keys: "shift+’", motionGenerators: [MotionParagraph.previousIndentationLevelDown, MotionLine.firstNonBlank] },
  ];

  constructor() {
    super([new SpecialKeyChar()]);

    this.maps.forEach((map) => {
      this.map(map.keys, map.motionGenerators, map.args);
      this.suggestions.push(map.keys);
    });
  }

  map(joinedKeys: string, motionGenerators: MotionGenerator[], args?: {}): void {
    const map = super.map(joinedKeys, args);
    (map as MotionMap).motionGenerators = motionGenerators;
  }

  unmapConflicts(node: RecursiveMap, keyToMap: string): void {
    if (keyToMap === this.indicator) {
      Object.getOwnPropertyNames(node).forEach((key) => {
        this.conflictRegExp.test(key) && delete node[key];
      });
    }

    if (this.conflictRegExp.test(keyToMap)) {
      delete node[this.indicator];
    }

    // This class has lower priority than other keys.
  }

  matchSpecial(
    inputs: string[],
    additionalArgs: { [key: string]: any },
    lastSpecialKeyMatch?: SpecialKeyMatchResult,
  ): SpecialKeyMatchResult | null {
    const { kind, map } = this.match(inputs);

    if (kind === MatchResultKind.FAILED) {
      return null;
    }

    if (map) {
      // Take N from last special key match.
      if (lastSpecialKeyMatch && lastSpecialKeyMatch.specialKey instanceof SpecialKeyN) {
        map.args = Object.assign(map.args ?? {}, { n: additionalArgs.n });
        delete additionalArgs.n;
      }

      additionalArgs.motions = (map as MotionMap).motionGenerators.map((generator) =>
        generator(map.args),
      );
    }

    return {
      specialKey: this,
      kind,
      matchedCount: inputs.length,
    };
  }
}
