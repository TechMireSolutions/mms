export interface KpiCategoryFlags {
  isContactsCategory: boolean;
  isStudentsCategory: boolean;
  isTeachersCategory: boolean;
  isSessionsCategory: boolean;
  needsContactAnalytics: boolean;
}

export function getKpiCategoryFlags(category: string): KpiCategoryFlags {
  const isContactsCategory = category === 'contacts';
  const isStudentsCategory = category === 'students';
  const isTeachersCategory = category === 'teachers' || category === 'faculty';
  const isSessionsCategory = category === 'sessions';
  const needsContactAnalytics = isContactsCategory || isStudentsCategory || isSessionsCategory;
  return {
    isContactsCategory,
    isStudentsCategory,
    isTeachersCategory,
    isSessionsCategory,
    needsContactAnalytics,
  };
}
