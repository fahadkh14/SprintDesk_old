-- SprintDesk schema (MySQL 8.4)
SET NAMES utf8mb4;
CREATE DATABASE IF NOT EXISTS sprintdesk CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE sprintdesk;

CREATE TABLE team_members (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name         VARCHAR(100) NOT NULL,
  email        VARCHAR(150) NOT NULL,
  job_title    VARCHAR(100) NOT NULL,
  avatar_color CHAR(7)      NOT NULL DEFAULT '#6938EF',
  created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_team_members_email (email)
) ENGINE=InnoDB;

CREATE TABLE projects (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name        VARCHAR(100) NOT NULL,
  description TEXT,
  status      ENUM('planning','active','on_hold','completed') NOT NULL DEFAULT 'active',
  color       CHAR(7)      NOT NULL DEFAULT '#6938EF',
  start_date  DATE NULL,
  due_date    DATE NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_projects_name (name)
) ENGINE=InnoDB;

CREATE TABLE categories (
  id    INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name  VARCHAR(60) NOT NULL,
  color CHAR(7)     NOT NULL DEFAULT '#6938EF',
  PRIMARY KEY (id),
  UNIQUE KEY uq_categories_name (name)
) ENGINE=InnoDB;

CREATE TABLE tasks (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  project_id   INT UNSIGNED NOT NULL,
  category_id  INT UNSIGNED NULL,
  assignee_id  INT UNSIGNED NULL,
  title        VARCHAR(200) NOT NULL,
  description  TEXT,
  status       ENUM('todo','in_progress','review','done') NOT NULL DEFAULT 'todo',
  priority     ENUM('low','medium','high','urgent')       NOT NULL DEFAULT 'medium',
  start_date   DATE NULL,
  due_date     DATE NULL,
  completed_at DATETIME NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_tasks_project (project_id),
  KEY idx_tasks_assignee (assignee_id),
  KEY idx_tasks_status (status),
  KEY idx_tasks_due_date (due_date),
  CONSTRAINT fk_tasks_project  FOREIGN KEY (project_id)  REFERENCES projects (id)     ON DELETE CASCADE,
  CONSTRAINT fk_tasks_category FOREIGN KEY (category_id) REFERENCES categories (id)   ON DELETE SET NULL,
  CONSTRAINT fk_tasks_assignee FOREIGN KEY (assignee_id) REFERENCES team_members (id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE subtasks (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  task_id    INT UNSIGNED NOT NULL,
  title      VARCHAR(200) NOT NULL,
  is_done    TINYINT(1)   NOT NULL DEFAULT 0,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_subtasks_task (task_id),
  CONSTRAINT fk_subtasks_task FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE comments (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  task_id    INT UNSIGNED NOT NULL,
  author_id  INT UNSIGNED NULL,
  body       TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_comments_task (task_id),
  CONSTRAINT fk_comments_task   FOREIGN KEY (task_id)   REFERENCES tasks (id)        ON DELETE CASCADE,
  CONSTRAINT fk_comments_author FOREIGN KEY (author_id) REFERENCES team_members (id) ON DELETE SET NULL
) ENGINE=InnoDB;
