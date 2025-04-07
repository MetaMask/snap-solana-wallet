export type IStateManager<TStateValue extends object> = {
  get(): Promise<TStateValue>;
  update(callback: (state: TStateValue) => TStateValue): Promise<TStateValue>;
};
