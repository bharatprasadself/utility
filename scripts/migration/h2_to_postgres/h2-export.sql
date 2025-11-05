-- H2 EXPORT SCRIPT: run this against your H2 database to dump CSVs for migration
-- How to run (option 1: H2 Console):
-- 1) Start the H2 console against your file DB (e.g., jdbc:h2:file:./data/utilitydb;DB_CLOSE_DELAY=-1)
-- 2) Execute this script. CSV files will be created under data/migration/h2_to_postgres/exports
--
-- How to run (option 2: headless using RUNSCRIPT):
-- RUNSCRIPT FROM 'data/migration/h2_to_postgres/h2-export.sql';

CREATE SCHEMA IF NOT EXISTS PUBLIC; -- no-op if exists

-- Ensure export folder exists (H2 doesn't create directories; create it in your OS if needed)
-- On Windows, create folder manually: data\\migration\\h2_to_postgres\\exports

-- Export each table to CSV with header
CALL CSVWRITE('data/migration/h2_to_postgres/exports/roles.csv', 'SELECT id, name FROM roles', 'charset=UTF-8 fieldSeparator=, lineSeparator=\n writeColumnHeader=true');
CALL CSVWRITE('data/migration/h2_to_postgres/exports/users.csv', 'SELECT id, username, password FROM users', 'charset=UTF-8 fieldSeparator=, lineSeparator=\n writeColumnHeader=true');
CALL CSVWRITE('data/migration/h2_to_postgres/exports/user_roles.csv', 'SELECT user_id, role_id FROM user_roles', 'charset=UTF-8 fieldSeparator=, lineSeparator=\n writeColumnHeader=true');
CALL CSVWRITE('data/migration/h2_to_postgres/exports/blogs.csv', 'SELECT id, title, content, author, publish_date, created_at, updated_at FROM blogs', 'charset=UTF-8 fieldSeparator=, lineSeparator=\n writeColumnHeader=true');
CALL CSVWRITE('data/migration/h2_to_postgres/exports/articles.csv', 'SELECT id, title, description, content, read_time, category, created_at, updated_at FROM articles', 'charset=UTF-8 fieldSeparator=, lineSeparator=\n writeColumnHeader=true');
CALL CSVWRITE('data/migration/h2_to_postgres/exports/article_tags.csv', 'SELECT article_id, tag FROM article_tags', 'charset=UTF-8 fieldSeparator=, lineSeparator=\n writeColumnHeader=true');
CALL CSVWRITE('data/migration/h2_to_postgres/exports/ebooks_content.csv', 'SELECT id, content_json, updated_at FROM ebooks_content', 'charset=UTF-8 fieldSeparator=, lineSeparator=\n writeColumnHeader=true');
CALL CSVWRITE('data/migration/h2_to_postgres/exports/newsletter_subscribers.csv', 'SELECT id, email, created_at, active, unsubscribed_at FROM newsletter_subscribers', 'charset=UTF-8 fieldSeparator=, lineSeparator=\n writeColumnHeader=true');

-- Done. Now move to Postgres and run postgres-import.sql via psql.
