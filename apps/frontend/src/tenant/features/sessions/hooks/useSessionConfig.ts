import { useStandardModuleConfig } from "@/hooks/useStandardModuleConfig";

export function useSessionConfig() {
  return useStandardModuleConfig("sessions");
}


