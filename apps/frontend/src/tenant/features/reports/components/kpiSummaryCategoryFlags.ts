export interface KpiCategoryFlags {
  isContactsCategory: boolean;
  isStudentsCategory: boolean;
  isTeachersCategory: boolean;
  needsContactAnalytics: boolean;
}

export function getKpiCategoryFlags(category: string): KpiCategoryFlags {
  const isContactsCategory = category === 'contacts';
  const isStudentsCategory = category === 'students';
  const isTeachersCategory = category === 'teachers' || category === 'faculty';
  const needsContactAnalytics = isContactsCategory || isStudentsCategory || category === 'sessions';
  return { isContactsCategory, isStudentsCategory, isTeachersCategory, needsContactAnalytics };
}
