import fs from 'fs';
import path from 'path';

// Read the SQL setup file
const sqlFile = path.join(process.cwd(), 'src/database/sqlite-setup.sql');
const sql = fs.readFileSync(sqlFile, 'utf8');

// Create a simple HTML file to initialize the database
const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Database Initialization</title>
    <script src="https://sql.js.org/dist/sql-wasm.js"></script>
</head>
<body>
    <h1>Initializing Database...</h1>
    <div id="status">Loading sql.js...</div>
    
    <script>
        const sql = \`${sql.replace(/`/g, '\\`')}\`;
        
        async function initDatabase() {
            try {
                document.getElementById('status').textContent = 'Initializing database...';
                
                const SQL = await initSqlJs({
                    locateFile: file => \`https://sql.js.org/dist/\${file}\`
                });
                
                const db = new SQL.Database();
                
                // Execute each SQL statement
                const statements = sql.split(';').filter(stmt => stmt.trim());
                
                for (const statement of statements) {
                    if (statement.trim()) {
                        db.run(statement.trim());
                    }
                }
                
                // Export the database
                const data = db.export();
                const blob = new Blob([data], { type: 'application/x-sqlite3' });
                const url = URL.createObjectURL(blob);
                
                // Create download link
                const a = document.createElement('a');
                a.href = url;
                a.download = 'database.sqlite';
                a.textContent = 'Download Database File';
                document.body.appendChild(a);
                
                document.getElementById('status').innerHTML = 
                    'Database initialized successfully!<br>' +
                    'Click the link below to download the database file.<br>' +
                    'Save it as "database.sqlite" in your project root.';
                
                db.close();
                
            } catch (error) {
                document.getElementById('status').textContent = 'Error: ' + error.message;
                console.error('Database initialization error:', error);
            }
        }
        
        initDatabase();
    </script>
</body>
</html>
`;

// Write the HTML file
const htmlFile = path.join(process.cwd(), 'init-database.html');
fs.writeFileSync(htmlFile, htmlContent);

console.log('Database initialization HTML file created:', htmlFile);
console.log('Open this file in your browser to create the database.sqlite file');
