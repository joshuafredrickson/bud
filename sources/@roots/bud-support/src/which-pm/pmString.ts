export const parse = (
  pmString?: string,
): `yarn` | `yarn-classic` | `npm` | `pnpm` | false => {
  if (!pmString) return false

  if (pmString.includes(`yarn/3`) || pmString.includes(`yarn@3`)) return `yarn`

  if (pmString.includes(`yarn`)) return `yarn-classic`
  if (pmString.includes(`npm`)) return `npm`
  if (pmString.includes(`pnpm`)) return `pnpm`

  return false
}
