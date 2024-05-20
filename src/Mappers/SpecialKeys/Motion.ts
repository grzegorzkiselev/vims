import { MotionCharacter } from "../../Motions/Character";
import { MotionDirection } from "../../Motions/Direction";
import { MotionDocument } from "../../Motions/Document";
import { MotionLine } from "../../Motions/Line";
import { MotionMatch } from "../../Motions/Match";
import { MotionMatchPair } from "../../Motions/MatchPair";
import { Motion } from "../../Motions/Motion";
import { MotionNavigation } from "../../Motions/Navigation";
import { MotionWord } from "../../Motions/Word";
import { MotionWrappedLine } from "../../Motions/WrappedLine";
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

export class SpecialKeyMotion extends GenericMapper implements SpecialKeyCommon {
  indicator = "{motion}";

  private conflictRegExp = /^[0]|\{char\}$/;

  private maps: MotionMap[] = [
    { keys: "h", motionGenerators: [MotionCharacter.left] },
    { keys: "left", motionGenerators: [MotionCharacter.left], presentation: "←" },
    { keys: "l", motionGenerators: [MotionCharacter.right] },
    { keys: "right", motionGenerators: [MotionCharacter.right], presentation: "→" },
    { keys: "k", motionGenerators: [MotionCharacter.up] },
    { keys: "up", motionGenerators: [MotionCharacter.up], presentation: "↑" },
    { keys: "j", motionGenerators: [MotionCharacter.down] },
    { keys: "down", motionGenerators: [MotionCharacter.down], presentation: "↓" },

    { keys: "w", motionGenerators: [MotionWord.nextStart] },
    {
      keys: "W",
      motionGenerators: [MotionWord.nextStart],
      args: { useBlankSeparatedStyle: true },
    },
    { keys: "e", motionGenerators: [MotionWord.nextEnd] },
    {
      keys: "E",
      motionGenerators: [MotionWord.nextEnd],
      args: { useBlankSeparatedStyle: true },
    },
    { keys: "b", motionGenerators: [MotionWord.prevStart] },
    {
      keys: "B",
      motionGenerators: [MotionWord.prevStart],
      args: { useBlankSeparatedStyle: true },
    },
    { keys: "g e", motionGenerators: [MotionWord.prevEnd] },
    {
      keys: "g E",
      motionGenerators: [MotionWord.prevEnd],
      args: { useBlankSeparatedStyle: true },
    },

    { keys: "f {char}", motionGenerators: [MotionMatch.next] },
    { keys: "F {char}", motionGenerators: [MotionMatch.prev] },
    {
      keys: "t {char}",
      motionGenerators: [MotionMatch.next],
      args: { isTill: true },
    },
    {
      keys: "T {char}",
      motionGenerators: [MotionMatch.prev],
      args: { isTill: true },
    },
    { keys: ".", motionGenerators: [MotionMatch.repeatLast] },
    {
      keys: ",",
      motionGenerators: [MotionMatch.repeatLast],
      args: { isReverse: true },
    },

    {
      keys: "%",
      motionGenerators: [
        (args: { n?: number }) =>
          args.n === undefined
            ? MotionMatchPair.matchPair()
            : MotionDocument.toLinePercent({ n: args.n }),
      ],
    },
    { keys: "^", motionGenerators: [MotionLine.firstNonBlank] },
    { keys: "0", motionGenerators: [MotionLine.start] },
    { keys: "$", motionGenerators: [MotionLine.end] },

    { keys: "g ^", motionGenerators: [MotionWrappedLine.firstNonBlank] },
    { keys: "g 0", motionGenerators: [MotionWrappedLine.start] },
    { keys: "g $", motionGenerators: [MotionWrappedLine.end] },
    { keys: "g m", motionGenerators: [MotionWrappedLine.middle] },
    { keys: "g k", motionGenerators: [MotionWrappedLine.up] },
    { keys: "g j", motionGenerators: [MotionWrappedLine.down] },

    {
      keys: "-",
      motionGenerators: [MotionCharacter.up, MotionLine.firstNonBlank],
    },
    {
      keys: "+",
      motionGenerators: [MotionCharacter.down, MotionLine.firstNonBlank],
    },
    {
      keys: "_",
      motionGenerators: [
        (args: { n?: number }) =>
          MotionCharacter.down({
            n: args.n === undefined ? 0 : args.n - 1,
          }),
        MotionLine.firstNonBlank,
      ],
    },

    { keys: "g g", motionGenerators: [MotionDocument.toLineOrFirst] },
    { keys: "G", motionGenerators: [MotionDocument.toLineOrLast] },

    { keys: "space", motionGenerators: [MotionDirection.next], presentation: "␣" },
    // { keys: "backspace", motionGenerators: [MotionDirection.prev], presentation: "⌫" },
    { keys: "g d", motionGenerators: [MotionNavigation.toDeclaration] },
    { keys: "g D", motionGenerators: [MotionNavigation.toTypeDefinition] },
  ];

  constructor() {
    super([new SpecialKeyChar()]);

    this.maps.forEach((map) => {
      this.map(map.keys, map.motionGenerators, map.args);
      this.suggestions.push(map.keys);
      // map.presentation ||
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
