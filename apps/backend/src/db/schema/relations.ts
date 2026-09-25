/**
 * Canonical Barrel for Drizzle Relations Definitions
 *
 * Decomposed into domain-bounded sub-modules under ./relations/:
 * - platform, system & audit: ./relations/platformRelations.js
 * - contacts & tenant users: ./relations/contactRelations.js
 * - academics (students, faculty, sessions, attendance, enrollments): ./relations/academicRelations.js
 * - finance, accounting, hasanat & obligations: ./relations/financeRelations.js
 * - examinations & question bank: ./relations/assessmentRelations.js
 * - messaging & dashboard: ./relations/messagingRelations.js
 */

export * from "./relations/platformRelations.js";
export * from "./relations/contactRelations.js";
export * from "./relations/academicRelations.js";
export * from "./relations/financeRelations.js";
export * from "./relations/assessmentRelations.js";
export * from "./relations/messagingRelations.js";
