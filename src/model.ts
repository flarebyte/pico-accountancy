export type CommandQifToTargetRunOpts = {
  sourceQifPath: string;
  destination: string;
  rulespath: string;
  columns?: string[];
};
