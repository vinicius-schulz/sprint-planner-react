export type AppAction<T = unknown> = {
  type: string;
  payload?: T;
  persist?: boolean;
};
