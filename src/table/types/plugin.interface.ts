import {
  GameData,
  InGameData,
  MenuData,
  PreGameData,
} from "~/shared/services/helpers/game-data";
import { MaybePromise } from "~/utils/promise";

import type { Table } from "..";

export type BaseContext = {
  table: Table;
  config: Record<string, any>;
};

export type MenuContext = BaseContext & {
  data: MenuData;
};

export type PreGameContext = BaseContext & {
  data: PreGameData;
};

export type InGameContext = BaseContext & {
  data: InGameData;
};

export type StateContext = BaseContext & {
  data: GameData;
};

export type InputPluginDefinition = {
  id: string;
  type?: "auto" | "post";
  isEssential?: boolean;
  deps?: string[];
  hooks: {
    onMenu?: (ctx: MenuContext) => MaybePromise<void>;
    onPreGame?: (ctx: PreGameContext) => MaybePromise<void>;
    onInGame?: (ctx: InGameContext) => MaybePromise<void>;
    onState?: (ctx: StateContext) => MaybePromise<void>;
  };
};

type RequiredFields = "id" | "type";
export type PluginDefinition = InputPluginDefinition &
  Required<Pick<InputPluginDefinition, RequiredFields>>;

export function definePlugin<TDef extends InputPluginDefinition>(
  definition: TDef,
): PluginDefinition {
  return { type: "auto", ...definition };
}
