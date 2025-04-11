export type IStateManager<TStateValue> = {
  get(): Promise<TStateValue>;
  update(callback: (state: TStateValue) => TStateValue): Promise<TStateValue>;
};
