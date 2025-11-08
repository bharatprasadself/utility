package com.utilityzone.utility.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;

/**
 * Lightweight safeguard to align schema changes when DDL auto is disabled.
 * Adds missing columns required by recent code updates.
 * This is intentionally minimal and safe to run multiple times.
 * For production-grade migrations, prefer Flyway/Liquibase.
 */
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
            ensureBlogsStatusColumn(conn);
            ensureArticlesStatusAndPublishDate(conn);
            ensureUsersEmailColumn(conn);
            ensurePasswordResetTokenTable(conn);
        } catch (SQLException e) {
            log.warn("Schema migration runner encountered an error: {}", e.getMessage());
        }
    }

    private void ensureBlogsStatusColumn(Connection conn) {
        try {
            if (!columnExists(conn, null, null, "BLOGS", "STATUS")) {
                log.info("Adding BLOGS.STATUS column and initializing values...");
                try (Statement st = conn.createStatement()) {
                    // Add STATUS column (VARCHAR(20))
                    st.executeUpdate("ALTER TABLE blogs ADD COLUMN status VARCHAR(20)");
                    // Initialize existing rows as PUBLISHED
                    st.executeUpdate("UPDATE blogs SET status='PUBLISHED' WHERE status IS NULL");
                    // Backfill publish_date for published rows where missing
                    st.executeUpdate("UPDATE blogs SET publish_date = COALESCE(publish_date, created_at, updated_at, CURRENT_TIMESTAMP) WHERE status='PUBLISHED' AND publish_date IS NULL");
                }
                log.info("BLOGS.STATUS column created and initialized.");
            } else {
                // Ensure published rows have a publish_date
                try (Statement st = conn.createStatement()) {
                    int updated = st.executeUpdate("UPDATE blogs SET publish_date = COALESCE(publish_date, created_at, updated_at, CURRENT_TIMESTAMP) WHERE status='PUBLISHED' AND publish_date IS NULL");
                    if (updated > 0) {
                        log.info("Backfilled publish_date for {} blog(s).", updated);
                    }
                }
            }
        } catch (SQLException e) {
            log.warn("Failed to ensure BLOGS.STATUS column: {}", e.getMessage());
        }
    }

    private void ensureArticlesStatusAndPublishDate(Connection conn) {
        try {
            boolean hasStatus = columnExists(conn, null, null, "ARTICLES", "STATUS");
            boolean hasPublishDate = columnExists(conn, null, null, "ARTICLES", "PUBLISH_DATE");
            if (!hasStatus || !hasPublishDate) {
                log.info("Ensuring ARTICLES has STATUS and PUBLISH_DATE columns...");
                try (Statement st = conn.createStatement()) {
                    if (!hasStatus) {
                        st.executeUpdate("ALTER TABLE articles ADD COLUMN status VARCHAR(20)");
                        st.executeUpdate("UPDATE articles SET status='PUBLISHED' WHERE status IS NULL");
                    }
                    if (!hasPublishDate) {
                        st.executeUpdate("ALTER TABLE articles ADD COLUMN publish_date TIMESTAMP");
                    }
                    // Backfill publish_date for published rows where missing
                    st.executeUpdate("UPDATE articles SET publish_date = COALESCE(publish_date, created_at, updated_at, CURRENT_TIMESTAMP) WHERE status='PUBLISHED' AND publish_date IS NULL");
                }
                log.info("ARTICLES columns ensured and initialized.");
            } else {
                try (Statement st = conn.createStatement()) {
                    int updated = st.executeUpdate("UPDATE articles SET publish_date = COALESCE(publish_date, created_at, updated_at, CURRENT_TIMESTAMP) WHERE status='PUBLISHED' AND publish_date IS NULL");
                    if (updated > 0) {
                        log.info("Backfilled publish_date for {} article(s).", updated);
                    }
                }
            }
        } catch (SQLException e) {
            log.warn("Failed to ensure ARTICLES columns: {}", e.getMessage());
        }
    }

    private boolean columnExists(Connection conn, String catalog, String schemaPattern, String tableName, String columnName) throws SQLException {
        DatabaseMetaData meta = conn.getMetaData();
        try (ResultSet rs = meta.getColumns(catalog, schemaPattern, tableName, columnName)) {
            return rs.next();
        }
    }

    private boolean tableExists(Connection conn, String tableName) throws SQLException {
        DatabaseMetaData meta = conn.getMetaData();
        try (ResultSet rs = meta.getTables(null, null, tableName, null)) {
            return rs.next();
        }
    }

    private void ensureUsersEmailColumn(Connection conn) {
        try {
            if (!columnExists(conn, null, null, "USERS", "EMAIL")) {
                log.info("Adding USERS.EMAIL column...");
                try (Statement st = conn.createStatement()) {
                    st.executeUpdate("ALTER TABLE users ADD COLUMN email VARCHAR(160)");
                }
                log.info("USERS.EMAIL column added. NOTE: existing rows have NULL; consider backfill.");
            }
        } catch (SQLException e) {
            log.warn("Failed to ensure USERS.EMAIL column: {}", e.getMessage());
        }
    }

    private void ensurePasswordResetTokenTable(Connection conn) {
        try {
            if (!tableExists(conn, "PASSWORD_RESET_TOKENS")) {
                log.info("Creating PASSWORD_RESET_TOKENS table...");
                try (Statement st = conn.createStatement()) {
                    st.executeUpdate("CREATE TABLE password_reset_tokens (" +
                            "id BIGSERIAL PRIMARY KEY," +
                            "user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE," +
                            "token_hash VARCHAR(128) NOT NULL UNIQUE," +
                            "expires_at TIMESTAMP NOT NULL," +
                            "used BOOLEAN NOT NULL DEFAULT FALSE)"
                    );
                    st.executeUpdate("CREATE INDEX idx_prt_user ON password_reset_tokens(user_id)");
                    st.executeUpdate("CREATE INDEX idx_prt_expiry ON password_reset_tokens(expires_at)");
                }
                log.info("PASSWORD_RESET_TOKENS table created.");
            }
        } catch (SQLException e) {
            log.warn("Failed to ensure PASSWORD_RESET_TOKENS table: {}", e.getMessage());
        }
    }
}
