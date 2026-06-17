/** Generic key-value option, useful for select dropdowns. */
export interface Option<T = string> {
  label: string;
  value: T;
}

/** Any entity that carries a human-readable display name. */
export interface Named {
  name: string;
}
