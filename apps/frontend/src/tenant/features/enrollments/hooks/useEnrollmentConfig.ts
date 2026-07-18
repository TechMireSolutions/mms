import { useStandardModuleConfig } from "@/hooks/useStandardModuleConfig";

export function useEnrollmentConfig() {
  return useStandardModuleConfig("enrollments");
}


