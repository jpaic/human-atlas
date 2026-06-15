import { create } from 'zustand'

interface AtlasStore {
  activeEra: number
  selectedSpeciesId: number | null
  mode: 'evolution' | 'migration' | 'genetics'
  setEra: (era: number) => void
  selectSpecies: (id: number | null) => void
  setMode: (mode: AtlasStore['mode']) => void
}

export const useAtlasStore = create<AtlasStore>((set) => ({
  activeEra: -300000,
  selectedSpeciesId: null,
  mode: 'evolution',
  setEra:          (era)  => set({ activeEra: era }),
  selectSpecies:   (id)   => set({ selectedSpeciesId: id }),
  setMode:         (mode) => set({ mode }),
}))