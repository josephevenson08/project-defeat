type SelectFieldProps<TValue extends string> = {
  label: string
  value: TValue
  values: readonly TValue[]
  onChange: (value: TValue) => void
}

export function SelectField<TValue extends string>({ label, value, values, onChange }: SelectFieldProps<TValue>) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value as TValue)}>
        {values.map((entry) => (
          <option key={entry} value={entry}>
            {entry}
          </option>
        ))}
      </select>
    </label>
  )
}
