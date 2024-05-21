import { Action } from "../Actions/Action";
import { GenericMap, GenericMapper, MatchResult, MatchResultKind } from "./Generic";
import { SpecialKeyChar } from "./SpecialKeys/Char";
import { SpecialKeyUniversalMotion } from "./SpecialKeys/UniversalMotion";
import { SpecialKeyMotion } from "./SpecialKeys/Motion";
import { SpecialKeyN } from "./SpecialKeys/N";
import { SpecialKeyTextObject } from "./SpecialKeys/TextObject";

export interface CommandMatchResult extends MatchResult {
  kind: MatchResultKind;
  map?: CommandMap;
}

export interface CommandMap extends GenericMap {
  actions: Action[];
  isRepeating?: boolean;
}

export class CommandMapper extends GenericMapper {
  constructor() {
    super([
      new SpecialKeyN(),
      new SpecialKeyMotion(),
      new SpecialKeyUniversalMotion(),
      new SpecialKeyTextObject(),
      new SpecialKeyChar(),
    ]);
  }

  map(joinedKeys: string, actions: Action[], args?: {}): void {
    const map = super.map(joinedKeys, args);
    (map as CommandMap).actions = actions;
  }

  match(inputs: string[]): CommandMatchResult {
    if (inputs?.length === 0) {
      return {
        kind: 0
      };
    }

    const { kind, map } = super.match(inputs);

    return {
      kind,
      map: map ? (map as CommandMap) : undefined
    };
  }
}
