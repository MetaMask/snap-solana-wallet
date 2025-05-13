export type IStateManager<TStateValue> = {
  get(): Promise<TStateValue>;
  set(key: string, value: TStateValue[keyof TStateValue]): Promise<void>;
  update(callback: (state: TStateValue) => TStateValue): Promise<TStateValue>;
};
