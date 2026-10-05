import { relations } from 'drizzle-orm';
import { workspaces } from '../platform.js';
import { contacts, tenantUsers } from '../contacts.js';
import { faculty, facultyDesignations, facultyDesignationRoles,
  facultyDepartments, facultyAssignments } from '../faculty.js';
import { organizationPositions } from '../organizationPositionTables.js';
import { hasanatDistributions } from '../hasanat.js';

export const facultyDesignationsRelations = relations(facultyDesignations, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [facultyDesignations.workspaceSubdomain],
    references: [workspaces.subdomain],
  }),
  roles: many(facultyDesignationRoles),
  facultyAssignments: many(facultyAssignments),
}));

export const facultyDesignationRolesRelations = relations(facultyDesignationRoles, ({ one }) => ({
  designation: one(facultyDesignations, {
    fields: [facultyDesignationRoles.workspaceSubdomain, facultyDesignationRoles.designationId],
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
  hasanatDistributions: many(hasanatDistributions),
  assignments: many(facultyAssignments),
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
  assignments: many(facultyAssignments),
}));

export const facultyAssignmentsRelations = relations(facultyAssignments, ({ one }) => ({
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
  position: one(organizationPositions, {
    fields: [facultyAssignments.workspaceSubdomain, facultyAssignments.positionId],
    references: [organizationPositions.workspaceSubdomain, organizationPositions.id],
  }),
}));
