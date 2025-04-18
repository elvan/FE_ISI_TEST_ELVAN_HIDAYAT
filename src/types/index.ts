export enum UserRole {
  LEAD = 'lead',
  TEAM_MEMBER = 'team_member',
}

export enum TaskStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  DONE = 'done',
  REJECTED = 'rejected',
}

export enum LogAction {
  CREATED = 'created',
  UPDATED = 'updated',
  STATUS_CHANGED = 'status_changed',
  ASSIGNED = 'assigned',
}

export enum EntityType {
  USER = 'user',
  TASK = 'task',
}
