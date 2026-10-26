# Frontend code organization

- Put reusable runtime values in `shared/constants`; keep feature-only values in that feature's `constants` directory.
- Put reusable behavior in `shared/functions`. Keep feature-only helpers beside their feature.
- Put data contracts in `interfaces/*.interface.ts` and consume them with `import type`. Interfaces have no runtime implementation.
- Use `shared/interfaces/api.interface.ts` for common response and pagination contracts. Preserve whether each endpoint requires data, meta, pagination, or totalPages.
- Extend the shared response interfaces only for endpoint-specific fields, such as workspace-folder status counts.
- Use `shared/constants/common.constants.ts` as the single source for preference keys and defaults.
- Derive union types from constant objects when values are needed at runtime. Auth session types and legacy note shapes demonstrate this pattern.
- Do not add new `models` directories or `.model.ts` / `.models.ts` files. Reuse helpers rather than introducing a base class solely to share functions.

Legacy note shape values and current editor layout values are different contracts; keep their constant sets distinct.
