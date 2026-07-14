import { create } from 'zustand'

const useVisualizationStore = create((set) => ({
  currentStep: 0,
  isPlaying: false,
  speed: 1,
  steps: [],
  
  setCurrentStep: (step) => set({ currentStep: step }),
  
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  
  setSpeed: (speed) => set({ speed }),
  
  setSteps: (steps) => set({ steps, currentStep: 0 }),
  
  nextStep: () => set((state) => ({
    currentStep: Math.min(state.currentStep + 1, state.steps.length - 1)
  })),
  
  previousStep: () => set((state) => ({
    currentStep: Math.max(state.currentStep - 1, 0)
  })),
  
  resetVisualization: () => set({
    currentStep: 0,
    isPlaying: false,
    speed: 1,
    steps: [],
  }),
}))

export default useVisualizationStore
