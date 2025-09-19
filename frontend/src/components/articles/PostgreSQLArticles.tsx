import { useState, useEffect } from 'react';
import ArticleLayout from './ArticleLayout';
import type { Article } from '../../types/Article';
import { ArticleCategory } from '../../types/Article';
import { ArticleService } from '../../services/article';


// Static data as fallback while API is being set up
const staticArticles: Article[] = [
  {
  id: "4001",
    title: "PostgreSQL Performance Optimization",
    description: "Learn advanced techniques for optimizing PostgreSQL POSTGRESQL performance, including indexing strategies and query optimization.",
    content: `# PostgreSQL Performance Optimization

## Introduction
Optimizing PostgreSQL performance is crucial for maintaining efficient and responsive POSTGRESQLs. Learn key strategies and best practices.

## Indexing Strategies

### 1. B-tree Indexes
\`\`\`sql
-- Create a basic B-tree index
CREATE INDEX idx_users_email ON users(email);

-- Create a composite index
CREATE INDEX idx_users_name ON users(last_name, first_name);

-- Create a unique index
CREATE UNIQUE INDEX idx_users_username ON users(username);
\`\`\`

### 2. Partial Indexes
\`\`\`sql
-- Index only active users
CREATE INDEX idx_active_users ON users(email) 
WHERE status = 'active';

-- Index high-value transactions
CREATE INDEX idx_large_transactions ON transactions(amount) 
WHERE amount > 1000;
\`\`\`

## Query Optimization

### 1. EXPLAIN ANALYZE
\`\`\`sql
EXPLAIN ANALYZE
SELECT u.name, o.order_date
FROM users u
JOIN orders o ON u.id = o.user_id
WHERE o.status = 'completed'
AND o.order_date >= NOW() - INTERVAL '30 days';
\`\`\`

### 2. Common Table Expressions (CTEs)
\`\`\`sql
WITH monthly_sales AS (
  SELECT 
    date_trunc('month', order_date) as month,
    SUM(amount) as total
  FROM orders
  GROUP BY 1
)
SELECT 
  month,
  total,
  LAG(total) OVER (ORDER BY month) as prev_month_total
FROM monthly_sales;
\`\`\`

## Configuration Tuning

### 1. Memory Settings
\`\`\`ini
# Adjust shared buffers
shared_buffers = 2GB

# Work memory per operation
work_mem = 16MB

# Maintenance work memory
maintenance_work_mem = 256MB
\`\`\`

## Best Practices
1. Regularly update statistics
2. Use appropriate index types
3. Monitor query performance
4. Implement proper vacuuming
5. Configure connection pooling`,
    tags: ["Performance", "Optimization", "Advanced"],
    readTime: "15 min read",
    category: ArticleCategory.POSTGRESQL,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
  id: "4002",
    title: "POSTGRESQL Design Best Practices",
    description: "Discover best practices for designing efficient and scalable PostgreSQL POSTGRESQL schemas.",
    content: `# POSTGRESQL Design Best Practices

## Introduction
Good POSTGRESQL design is crucial for application performance and maintainability. Learn PostgreSQL-specific design patterns and best practices.

## Schema Design Principles

### 1. Normalization
\`\`\`sql
-- Bad Design (Denormalized)
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  customer_name VARCHAR(100),
  customer_email VARCHAR(100),
  customer_address TEXT
);

-- Good Design (Normalized)
CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100),
  address TEXT
);

CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id),
  order_date TIMESTAMP
);
\`\`\`

### 2. Data Types
\`\`\`sql
-- Use appropriate data types
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  price DECIMAL(10,2),  -- For monetary values
  created_at TIMESTAMP WITH TIME ZONE,
  tags TEXT[],  -- Array type
  metadata JSONB  -- JSON data
);
\`\`\`

## Relationships and Constraints

### 1. Foreign Keys
\`\`\`sql
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  CONSTRAINT fk_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
);
\`\`\`

### 2. Check Constraints
\`\`\`sql
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  price DECIMAL(10,2),
  CONSTRAINT positive_price 
    CHECK (price > 0)
);
\`\`\`

## Best Practices
1. Use SERIAL or BIGSERIAL for IDs
2. Implement proper indexing strategy
3. Use appropriate constraints
4. Consider partitioning for large tables
5. Implement proper naming conventions`,
    tags: ["POSTGRESQL Design", "Best Practices", "Schema"],
    readTime: "12 min read",
    category: ArticleCategory.POSTGRESQL,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
  id: "4003",
    title: "PostgreSQL Backup and Recovery",
    description: "Comprehensive guide to implementing robust backup and recovery strategies for PostgreSQL POSTGRESQLs.",
    content: `# PostgreSQL Backup and Recovery

## Introduction
Learn how to implement reliable backup and recovery strategies for PostgreSQL POSTGRESQLs to ensure data safety and business continuity.

## Backup Strategies

### 1. Logical Backups (pg_dump)
\`\`\`bash
# Backup single POSTGRESQL
pg_dump dbname > backup.sql

# Backup specific tables
pg_dump -t table1 -t table2 dbname > tables_backup.sql

# Custom format backup (compressed)
pg_dump -Fc dbname > backup.custom
\`\`\`

### 2. Physical Backups
\`\`\`bash
# Base backup
pg_basebackup -D /backup/path -Ft -z

# Continuous archiving (in postgresql.conf)
wal_level = replica
archive_mode = on
archive_command = 'cp %p /archive/%f'
\`\`\`

## Recovery Procedures

### 1. Point-in-Time Recovery
\`\`\`bash
# Recovery configuration (recovery.conf)
restore_command = 'cp /archive/%f %p'
recovery_target_time = '2025-09-15 10:00:00'

# Start recovery
pg_ctl start
\`\`\`

### 2. Restoring from Logical Backup
\`\`\`bash
# Restore from SQL dump
psql dbname < backup.sql

# Restore from custom format
pg_restore -d dbname backup.custom
\`\`\`

## Backup Automation

### 1. Backup Script Example
\`\`\`bash
#!/bin/bash
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Full backup
pg_dump -Fc mydb > $BACKUP_DIR/full_$DATE.backup

# Clean old backups (keep 7 days)
find $BACKUP_DIR -type f -mtime +7 -delete
\`\`\`

## Best Practices
1. Regular backup testing
2. Multiple backup methods
3. Offsite backup storage
4. Monitoring backup success
5. Document recovery procedures`,
    tags: ["Backup", "Recovery", "Maintenance"],
    readTime: "10 min read",
    category: ArticleCategory.POSTGRESQL,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

function PostgreSQLArticles() {
  const [articles, setArticles] = useState<Article[]>(staticArticles);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadArticles = async () => {
      try {
        console.log('🔍 Fetching articles in category: POSTGRESQL');
        const response = await ArticleService.getArticlesByCategory(ArticleCategory.POSTGRESQL);
        console.log(`✅ Successfully fetched ${response.data.length} articles in category POSTGRESQL`);
        if (response.data && response.data.length > 0) {
          setArticles(response.data);
        } else {
          console.log('No articles returned from API, using static content');
          setArticles(staticArticles);
        }
      } catch (e) {
        console.log('No articles returned from API, using static content');
        setArticles(staticArticles);
      } finally {
        setLoading(false);
      }
    };

    loadArticles();
  }, []);

  return (
     
        <ArticleLayout
          title="PostgreSQL Articles"
          description="Learn about PostgreSQL performance, schema design, and best practices."
          articles={articles}
          isAdmin={false}
          handleEdit={() => {}}
          handleDelete={() => {}}
        /> 
  );     
}

export default PostgreSQLArticles;