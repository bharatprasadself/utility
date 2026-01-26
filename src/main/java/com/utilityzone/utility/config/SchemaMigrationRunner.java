 package com.utilityzone.utility.config;

 import org.slf4j.Logger;
 import org.slf4j.LoggerFactory;
 import org.springframework.boot.context.event.ApplicationReadyEvent;
 import org.springframework.context.event.EventListener;
 import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;

// /**
//  * Lightweight safeguard to align schema changes when DDL auto is disabled.
//  * Adds missing columns required by recent code updates.
//  * This is intentionally minimal and safe to run multiple times.
//  * For production-grade migrations, prefer Flyway/Liquibase.
//  */
 @Component
 public class SchemaMigrationRunner {
     private static final Logger log = LoggerFactory.getLogger(SchemaMigrationRunner.class);

     private final DataSource dataSource;

     public SchemaMigrationRunner(DataSource dataSource) {
         this.dataSource = dataSource;
     }

     @EventListener(ApplicationReadyEvent.class)
     public void onReady() {
        try (Connection conn = dataSource.getConnection()) {
           // Ensure articles.group_name column exists (safe to run repeatedly)
            ensureArticlesGroupNameColumn(conn);
         } catch (SQLException e) {
             log.warn("Schema migration runner encountered an error: {}", e.getMessage());
         }
     }

    //  private void dropTemplateDescriptionsTable(Connection conn) {
    //      try (Statement st = conn.createStatement()) {
    //          st.executeUpdate("DROP TABLE IF EXISTS template_descriptions");
    //          log.info("Dropped template_descriptions table if it existed.");
    //      } catch (SQLException e) {
    //          log.warn("Failed to drop template_descriptions table: {}", e.getMessage());
    //      }
    //  }

//     private void ensureCanvaTemplatesTable(Connection conn) {
//         try {
//             if (!tableExists(conn, "CANVA_TEMPLATES")) {
//                 log.info("Creating CANVA_TEMPLATES table...");
//                 try (Statement st = conn.createStatement()) {
//                     st.executeUpdate(
//                         "CREATE TABLE IF NOT EXISTS canva_templates (" +
//                         "id BIGSERIAL PRIMARY KEY," +
//                         "title VARCHAR(255) NOT NULL," +
//                         "canva_use_copy_url VARCHAR(1000)," +
//                         "mobile_canva_use_copy_url VARCHAR(1000)," +
//                         "mockup_url VARCHAR(1000)," +
//                         "buyer_pdf_url VARCHAR(1000)," +
//                         "etsy_listing_url VARCHAR(1000)," +
//                         "secondary_mockup_url VARCHAR(1000)," +
//                         "mobile_mockup_url VARCHAR(1000)," +
//                         "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP," +
//                         "updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP" +
//                         ")"
//                     );
//                 }
//                 log.info("CANVA_TEMPLATES table created.");
//             }
//         } catch (SQLException e) {
//             log.warn("Failed to ensure CANVA_TEMPLATES table: {}", e.getMessage());
//         }
//     }

//     private void ensureCanvaTemplatesStatusColumn(Connection conn) {
//         try {
//             if (!columnExists(conn, null, null, "CANVA_TEMPLATES", "STATUS")) {
//                 log.info("Adding CANVA_TEMPLATES.STATUS column and initializing values...");
//                 try (Statement st = conn.createStatement()) {
//                     st.executeUpdate("ALTER TABLE canva_templates ADD COLUMN status VARCHAR(20) DEFAULT 'draft'");
//                     st.executeUpdate("UPDATE canva_templates SET status = 'draft' WHERE status IS NULL");
//                 }
//                 log.info("CANVA_TEMPLATES.STATUS column added and initialized.");
//             }
//         } catch (SQLException e) {
//             log.warn("Failed to ensure CANVA_TEMPLATES.STATUS column: {}", e.getMessage());
//         }
//     }

//     private void ensureBlogsStatusColumn(Connection conn) {
//         try {
//             if (!columnExists(conn, null, null, "BLOGS", "STATUS")) {
//                 log.info("Adding BLOGS.STATUS column and initializing values...");
//                 try (Statement st = conn.createStatement()) {
//                     // Add STATUS column (VARCHAR(20))
//                     st.executeUpdate("ALTER TABLE blogs ADD COLUMN status VARCHAR(20)");
//                     // Initialize existing rows as PUBLISHED
//                     st.executeUpdate("UPDATE blogs SET status='PUBLISHED' WHERE status IS NULL");
//                     // Backfill publish_date for published rows where missing
//                     st.executeUpdate("UPDATE blogs SET publish_date = COALESCE(publish_date, created_at, updated_at, CURRENT_TIMESTAMP) WHERE status='PUBLISHED' AND publish_date IS NULL");
//                 }
//                 log.info("BLOGS.STATUS column created and initialized.");
//             } else {
//                 // Ensure published rows have a publish_date
//                 try (Statement st = conn.createStatement()) {
//                     int updated = st.executeUpdate("UPDATE blogs SET publish_date = COALESCE(publish_date, created_at, updated_at, CURRENT_TIMESTAMP) WHERE status='PUBLISHED' AND publish_date IS NULL");
//                     if (updated > 0) {
//                         log.info("Backfilled publish_date for {} blog(s).", updated);
//                     }
//                 }
//             }
//         } catch (SQLException e) {
//             log.warn("Failed to ensure BLOGS.STATUS column: {}", e.getMessage());
//         }
//     }

//     private void ensureArticlesStatusAndPublishDate(Connection conn) {
//         try {
//             boolean hasStatus = columnExists(conn, null, null, "ARTICLES", "STATUS");
//             boolean hasPublishDate = columnExists(conn, null, null, "ARTICLES", "PUBLISH_DATE");
//             if (!hasStatus || !hasPublishDate) {
//                 log.info("Ensuring ARTICLES has STATUS and PUBLISH_DATE columns...");
//                 try (Statement st = conn.createStatement()) {
//                     if (!hasStatus) {
//                         st.executeUpdate("ALTER TABLE articles ADD COLUMN status VARCHAR(20)");
//                         st.executeUpdate("UPDATE articles SET status='PUBLISHED' WHERE status IS NULL");
//                     }
//                     if (!hasPublishDate) {
//                         st.executeUpdate("ALTER TABLE articles ADD COLUMN publish_date TIMESTAMP");
//                     }
//                     // Backfill publish_date for published rows where missing
//                     st.executeUpdate("UPDATE articles SET publish_date = COALESCE(publish_date, created_at, updated_at, CURRENT_TIMESTAMP) WHERE status='PUBLISHED' AND publish_date IS NULL");
//                 }
//                 log.info("ARTICLES columns ensured and initialized.");
//             } else {
//                 try (Statement st = conn.createStatement()) {
//                     int updated = st.executeUpdate("UPDATE articles SET publish_date = COALESCE(publish_date, created_at, updated_at, CURRENT_TIMESTAMP) WHERE status='PUBLISHED' AND publish_date IS NULL");
//                     if (updated > 0) {
//                         log.info("Backfilled publish_date for {} article(s).", updated);
//                     }
//                 }
//             }
//         } catch (SQLException e) {
//             log.warn("Failed to ensure ARTICLES columns: {}", e.getMessage());
//         }
//     }

    private boolean columnExists(Connection conn, String catalog, String schemaPattern, String tableName, String columnName) throws SQLException {
        DatabaseMetaData meta = conn.getMetaData();
        try (ResultSet rs = meta.getColumns(catalog, schemaPattern, tableName, columnName)) {
            return rs.next();
        }
    }

    private void ensureArticlesGroupNameColumn(Connection conn) {
        try {
            // If group_name already exists, nothing to do
            if (columnExists(conn, null, null, "ARTICLES", "GROUP_NAME")) {
                return;
            }

            // If an old 'header' column exists, prefer renaming it to 'group_name'
            if (columnExists(conn, null, null, "ARTICLES", "HEADER")) {
                log.info("Renaming ARTICLES.HEADER -> ARTICLES.GROUP_NAME...");
                try (Statement st = conn.createStatement()) {
                    st.executeUpdate("ALTER TABLE articles RENAME COLUMN header TO group_name");
                }
                log.info("ARTICLES.HEADER renamed to GROUP_NAME.");
                return;
            }

            // Otherwise create the new column
            log.info("Adding ARTICLES.GROUP_NAME column...");
            try (Statement st = conn.createStatement()) {
                st.executeUpdate("ALTER TABLE articles ADD COLUMN group_name VARCHAR(255)");
            }
            log.info("ARTICLES.GROUP_NAME column added.");
        } catch (SQLException e) {
            log.warn("Failed to ensure ARTICLES.GROUP_NAME column: {}", e.getMessage());
        }
    }

//     private boolean tableExists(Connection conn, String tableName) throws SQLException {
//         DatabaseMetaData meta = conn.getMetaData();
//         try (ResultSet rs = meta.getTables(null, null, tableName, null)) {
//             return rs.next();
//         }
//     }

//     private void ensureUsersEmailColumn(Connection conn) {
//         try {
//             if (!columnExists(conn, null, null, "USERS", "EMAIL")) {
//                 log.info("Adding USERS.EMAIL column...");
//                 try (Statement st = conn.createStatement()) {
//                     st.executeUpdate("ALTER TABLE users ADD COLUMN email VARCHAR(160)");
//                 }
//                 log.info("USERS.EMAIL column added. NOTE: existing rows have NULL; consider backfill.");
//             }
//         } catch (SQLException e) {
//             log.warn("Failed to ensure USERS.EMAIL column: {}", e.getMessage());
//         }
//     }

//     private void ensurePasswordResetTokenTable(Connection conn) {
//         try {
//             if (!tableExists(conn, "PASSWORD_RESET_TOKENS")) {
//                 log.info("Creating PASSWORD_RESET_TOKENS table...");
//                 try (Statement st = conn.createStatement()) {
//                     st.executeUpdate("CREATE TABLE password_reset_tokens (" +
//                             "id BIGSERIAL PRIMARY KEY," +
//                             "user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE," +
//                             "token_hash VARCHAR(128) NOT NULL UNIQUE," +
//                             "expires_at TIMESTAMP NOT NULL," +
//                             "used BOOLEAN NOT NULL DEFAULT FALSE)"
//                     );
//                     st.executeUpdate("CREATE INDEX idx_prt_user ON password_reset_tokens(user_id)");
//                     st.executeUpdate("CREATE INDEX idx_prt_expiry ON password_reset_tokens(expires_at)");
//                 }
//                 log.info("PASSWORD_RESET_TOKENS table created.");
//             }
//         } catch (SQLException e) {
//             log.warn("Failed to ensure PASSWORD_RESET_TOKENS table: {}", e.getMessage());
//         }
//     }

//     private void ensureTemplatesTable(Connection conn) {
//         try {
//             if (!tableExists(conn, "TEMPLATES")) {
//                 log.info("Creating TEMPLATES table...");
//                 try (Statement stmt = conn.createStatement()) {
//                     stmt.executeUpdate(
//                         "CREATE TABLE IF NOT EXISTS templates (" +
//                         "id BIGSERIAL PRIMARY KEY, " +
//                         "title VARCHAR(255), " +
//                         "description TEXT, " +
//                         "created_at TIMESTAMP, " +
//                         "updated_at TIMESTAMP)"
//                     );
//                 }
//                 log.info("TEMPLATES table created.");
//             }
//         } catch (SQLException e) {
//             log.warn("Failed to ensure TEMPLATES table: {}", e.getMessage());
//         }
//     }
}
