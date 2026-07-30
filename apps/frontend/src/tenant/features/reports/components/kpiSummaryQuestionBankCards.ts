import { CalendarCheck, BarChart2, Target, UserCheck } from 'lucide-react';
import type { QuestionBankQuestion, QuestionBankResult, QuestionBankTest } from '@mms/shared';
import type { TranslationFunction } from '@/lib/contexts/TranslationContext';
import type { CategorizedKPIItem } from './kpiSummaryTypes';

interface BuildQuestionBankKPICardsOptions {
  questionBankQuestions: QuestionBankQuestion[];
  questionBankTests: QuestionBankTest[];
  questionBankResults: QuestionBankResult[];
  t: TranslationFunction;
}

export function buildQuestionBankKPICards({
  questionBankQuestions,
  questionBankTests,
  questionBankResults,
  t,
}: BuildQuestionBankKPICardsOptions): {
  cards: CategorizedKPIItem[];
  questionBankTotalMax: number;
} {
  let questionBankTotalObtained = 0;
  let questionBankTotalMax = 0;
  questionBankResults.forEach((result) => {
    const test = questionBankTests.find((option) => option.id === result.testId);
    if (!test) return;
    questionBankTotalObtained += Object.values(result.scores).reduce(
      (sum, score) => sum + (typeof score === 'number' ? score : 0),
      0,
    );
    questionBankTotalMax += test.questionIds.reduce((sum, questionId) => {
      const question = questionBankQuestions.find((option) => option.id === questionId);
      return sum + (question?.marks ?? 0);
    }, 0);
  });
  const averageQuestionBankScore = questionBankTotalMax > 0
    ? `${Math.round((questionBankTotalObtained / questionBankTotalMax) * 100)}%`
    : '0%';

  return {
    questionBankTotalMax,
    cards: [
      {
        id: 'kpi-total-questions', icon: BarChart2, label: t('reports.kpi.totalQuestions'), value: String(questionBankQuestions.length),
        sub: t('reports.kpi.sub.inQuestionBank'), color: 'primary', trend: 'up', categories: ['questionBank'], isAvailable: questionBankQuestions.length > 0,
      },
      {
        id: 'kpi-generated-tests', icon: CalendarCheck, label: t('reports.kpi.generatedTests'), value: String(questionBankTests.length),
        sub: t('reports.kpi.sub.autoBuiltPapers'), color: 'blue', trend: 'flat', categories: ['questionBank'], isAvailable: questionBankTests.length > 0,
      },
      {
        id: 'kpi-test-submissions', icon: UserCheck, label: t('reports.kpi.testSubmissions'), value: String(questionBankResults.length),
        sub: t('reports.kpi.sub.gradedAttempts'), color: 'violet', trend: 'up', categories: ['questionBank'], isAvailable: questionBankResults.length > 0,
      },
      {
        id: 'kpi-avg-test-score', icon: Target, label: t('reports.kpi.avgTestScore'), value: averageQuestionBankScore,
        sub: t('reports.kpi.sub.acrossSubmissions'), color: 'green', trend: 'flat', categories: ['questionBank'],
        isAvailable: questionBankResults.length > 0 && questionBankTotalMax > 0,
      },
    ],
  };
}
