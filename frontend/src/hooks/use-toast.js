import { toast } from "sonner"

export const useToast = () => {
  return {
    toast,
    dismiss: (id) => {
      // Sonner handles dismissing automatically
    }
  }
}