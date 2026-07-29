/**
 * Cross-module public surface for Question Bank Query hooks.
 * Other features and shared UI must import from here — not `@/tenant/features/question-bank/hooks/*`.
 */
export {
  QUESTION_BANK_METRICS_QUERY_KEY,
  QUESTION_BANK_QUESTIONS_QUERY_KEY,
  QUESTION_BANK_TESTS_QUERY_KEY,
  QUESTION_BANK_RESULTS_QUERY_KEY,
  useQuestionBankQuestions,
  useQuestionBankQuestionsCollection,
  useQuestionBankTests,
  useQuestionBankTestsCollection,
  useQuestionBankResults,
  useQuestionBankResultsCollection,
  useQuestionBankMutations,
  useQuestionBankMetrics,
} from "@/tenant/features/question-bank/hooks/useQuestionBankApi";
