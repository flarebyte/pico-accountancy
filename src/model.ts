export type ConvertTarget = 'bank'|'debit'|'credit'|'expenses'|'total'

export type CommandQifToTargetRunOpts = {
    sourceQifPath: string,
    destination: string,
  target: ConvertTarget,
  rulespath: string,
  columns?: string[],
}