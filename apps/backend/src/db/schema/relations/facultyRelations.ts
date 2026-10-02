import { relations } from 'drizzle-orm';
import { workspaces } from '../platform.js';
import { contacts, tenantUsers } from '../contacts.js';
import { faculty, facultyDesignations, facultyDesignationRoles, facultyDesignationAssignments,
  facultyDepartments, facultyAssignments } from '../faculty.js';
import { hasanatDistributions } from '../hasanat.js';

export const facultyDesignationsRelations = relations(facultyDesignations, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [facultyDesignations.workspaceSubdomain],
    references: [workspaces.subdomain],
  }),
  roles: many(facultyDesignationRoles),
  facultyAssignments: many(facultyAssignments),
  assignments: many(facultyDesignationAssignments),
}));

export const facultyDesignationRolesRelations = relations(facultyDesignationRoles, ({ one }) => ({
  designation: one(facultyDesignations, {
    fields: [facultyDesignationRoles.workspaceSubdomain, facultyDesignationRoles.designationId],
    references: [facultyDesignations.workspaceSubdomain, facultyDesignations.id],
  }),
}));

export const facultyDesignationAssignmentsRelations = relations(facultyDesignationAssignments, ({ one }) => ({
  faculty: one(faculty, {
    fields: [facultyDesignationAssignments.workspaceSubdomain, facultyDesignationAssignments.facultyId],
    references: [faculty.workspaceSubdomain, faculty.id],
  }),
  designation: one(facultyDesignations, {
    fields: [facultyDesignationAssignments.workspaceSubdomain, facultyDesignationAssignments.designationId],
    references: [facultyDesignations.workspaceSubdomain, facultyDesignations.id],
  }),
}));

export const facultyRelations = relations(faculty, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [faculty.workspaceSubdomain],
    references: [workspaces.subdomain],
  }),
  contact: one(contacts, {
    fields: [faculty.workspaceSubdomain, faculty.contactId],
    references: [contacts.workspaceSubdomain, contacts.id],
  }),
  user: one(tenantUsers, {
    fields: [faculty.workspaceSubdomain, faculty.userId],
    references: [tenantUsers.workspaceSubdomain, tenantUsers.id],
  }),
  supervisor: one(faculty, {
    fields: [faculty.workspaceSubdomain, faculty.reportingFacultyId],
    references: [faculty.workspaceSubdomain, faculty.id],
    relationName: 'faculty_reporting',
  }),
  subordinates: many(faculty, {
    relationName: 'faculty_reporting',
  }),
  hasanatDistributions: many(hasanatDistributions),
  designationAssignments: many(facultyDesignationAssignments),
  assignments: many(facultyAssignments),
  headedDepartments: many(facultyDepartments),
}));

export const facultyDepartmentsRelations = relations(facultyDepartments, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [facultyDepartments.workspaceSubdomain],
    references: [workspaces.subdomain],
  }),
  parent: one(facultyDepartments, {
    fields: [facultyDepartments.workspaceSubdomain, facultyDepartments.parentId],
    references: [facultyDepartments.workspaceSubdomain, facultyDepartments.id],
    relationName: 'dept_hierarchy',
  }),
  children: many(facultyDepartments, {
    relationName: 'dept_hierarchy',
  }),
  headFaculty: one(faculty, {
    fields: [facultyDepartments.workspaceSubdomain, facultyDepartments.headFacultyId],
    references: [faculty.workspaceSubdomain, faculty.id],
  }),
  assignments: many(facultyAssignments),
}));

export const facultyAssignmentsRelations = relations(facultyAssignments, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [facultyAssignments.workspaceSubdomain],
    references: [workspaces.subdomain],
  }),
  faculty: one(faculty, {
    fields: [facultyAssignments.workspaceSubdomain, facultyAssignments.facultyId],
    references: [faculty.workspaceSubdomain, faculty.id],
  }),
  department: one(facultyDepartments, {
    fields: [facultyAssignments.workspaceSubdomain, facultyAssignments.departmentId],
    references: [facultyDepartments.workspaceSubdomain, facultyDepartments.id],
  }),
  designation: one(facultyDesignations, {
    fields: [facultyAssignments.workspaceSubdomain, facultyAssignments.designationId],
    references: [facultyDesignations.workspaceSubdomain, facultyDesignations.id],
  }),
  supervisorAssignment: one(facultyAssignments, {
    fields: [facultyAssignments.workspaceSubdomain, facultyAssignments.reportsToAssignmentId],
    references: [facultyAssignments.workspaceSubdomain, facultyAssignments.id],
    relationName: 'assignment_reporting',
  }),
  subordinateAssignments: many(facultyAssignments, {
    relationName: 'assignment_reporting',
  }),
}));

