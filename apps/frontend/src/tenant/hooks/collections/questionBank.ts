/**
 * Cross-module public surface for Question Bank Query hooks.
 * Other features and shared UI must import from here — not `@/tenant/features/question-bank/hooks/*`.
 */
export {
  useQuestionBankQuestions,
  useQuestionBankQuestionsCollection,
  useQuestionBankTests,
  useQuestionBankTestsCollection,
  useQuestionBankResults,
  useQuestionBankResultsCollection,
  useQuestionBankMutations,
  useQuestionBankMetrics,
} from "@/tenant/features/question-bank/hooks/useQuestionBankApi";
