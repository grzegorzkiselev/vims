import { TextObjectBlock } from "../../TextObjects/Block";
import { TextObjectQuotedString } from "../../TextObjects/QuotedString";
import { TextObjectTag } from "../../TextObjects/Tag";
import { TextObject } from "../../TextObjects/TextObject";
import { TextObjectWord } from "../../TextObjects/Word";
import { GenericMap, GenericMapper, MatchResultKind, RecursiveMap } from "../Generic";
import { SpecialKeyCommon, SpecialKeyMatchResult } from "./Common";

interface TextObjectGenerator {
  (args?: {}): TextObject;
}

interface TextObjectMap extends GenericMap {
  textObjectGenerator: TextObjectGenerator;
}

interface TextObjectMapInfo {
  characters: string[];
  method: (args: { isInclusive: boolean }) => TextObject;
  args?: {};
}

export class SpecialKeyTextObject extends GenericMapper implements SpecialKeyCommon {
  indicator = "{textObject}";

  private conflictRegExp = /^[ai]|\{char\}$/;

  private invokers = ["i", "a"];

  private mapInfos: TextObjectMapInfo[] = [
    {
      characters: ["b", "(", ")"],
      method: TextObjectBlock.byParentheses,
    },
    {
      characters: ["[", "]"],
      method: TextObjectBlock.byBrackets,
    },
    {
      characters: ["B", "{", "}"],
      method: TextObjectBlock.byBraces,
    },
    {
      characters: ["<", ">"],
      method: TextObjectBlock.byChevrons,
    },
    {
      characters: ["'"],
      method: TextObjectQuotedString.bySingle,
    },
    {
      characters: ['"'],
      method: TextObjectQuotedString.byDouble,
    },
    {
      characters: ["`"],
      method: TextObjectQuotedString.byBackward,
    },
    {
      characters: ["t"],
      method: TextObjectTag.byTag,
    },
    {
      characters: ["w"],
      method: TextObjectWord.byWord,
      args: { useBlankSeparatedStyle: false },
    },
    {
      characters: ["W"],
      method: TextObjectWord.byWord,
      args: { useBlankSeparatedStyle: true },
    },
  ];

  // private maps: TextObjectMap[] = [
  // Reserved for special maps.
  // ];

  constructor() {
    super();

    this.mapInfos.forEach((mapInfo) => {
      mapInfo.characters.forEach((character) => {
        this.invokers.forEach((invoker) => {
          this.map(
            `${invoker} ${character}`,
            mapInfo.method,
            Object.assign({}, mapInfo.args, { isInclusive: true }),
          );
          this.suggestions.push(`${invoker} ${character}`);
        });
      });
    });

    // this.maps.forEach((map) => {
    //   this.map(map.keys, map.textObjectGenerator, map.args);
    // });
  }

  map(joinedKeys: string, textObjectGenerator: TextObjectGenerator, args?: {}): void {
    const map = super.map(joinedKeys, args);
    (map as TextObjectMap).textObjectGenerator = textObjectGenerator;
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
      additionalArgs.textObject = (map as TextObjectMap).textObjectGenerator(map.args);
    }

    return {
      specialKey: this,
      kind,
      matchedCount: inputs.length,
    };
  }
}
