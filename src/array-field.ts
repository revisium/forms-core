export type ArrayFieldConfig<TItem> = {
  readonly getItemId: (item: TItem) => string;
};

export function arrayField<TItem>(
  config: ArrayFieldConfig<TItem>,
): ArrayFieldConfig<TItem> {
  return config;
}
