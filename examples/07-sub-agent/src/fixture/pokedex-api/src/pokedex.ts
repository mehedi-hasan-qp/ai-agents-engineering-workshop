export interface Pokemon {
  id: number;
  name: string;
  type: string;
}

const POKEDEX: Pokemon[] = [
  { id: 1, name: "Bulbasaur", type: "Grass" },
  { id: 4, name: "Charmander", type: "Fire" },
  { id: 7, name: "Squirtle", type: "Water" },
];

export function getPokemonById(id: number): Pokemon | undefined {
  return POKEDEX.find((pokemon) => pokemon.id === id);
}

// Bug: does not trim whitespace before comparing names.
export function getPokemonByName(name: string): Pokemon | undefined {
  return POKEDEX.find((pokemon) => pokemon.name.toLowerCase() === name.toLowerCase());
}
