import { useState } from 'react'

type Props = {
  onSearch: (term: string) => void
}

export default function SearchForm({ onSearch }: Props) {
  const [term, setTerm] = useState('')

  return (
    <form
      className="search"
      role="search"
      onSubmit={(event) => {
        event.preventDefault()
        onSearch(term.trim())
      }}
    >
      <input
        aria-label="Buscar por nome, documento ou telefone"
        placeholder="Nome, documento ou telefone"
        value={term}
        onChange={(event) => setTerm(event.target.value)}
      />
      <button type="submit">Buscar</button>
    </form>
  )
}
