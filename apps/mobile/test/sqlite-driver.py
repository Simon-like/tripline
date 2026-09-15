"""Host SQLite bridge for executing repository SQL and real transaction rollback.
No production dependency. One persistent in-memory connection per test worker.
"""
import json
import sqlite3
import sys
connection = sqlite3.connect(':memory:', isolation_level=None)
connection.row_factory = sqlite3.Row
for line in sys.stdin:
    request = json.loads(line)
    try:
        if request['mode'] == 'script':
            connection.executescript(request['sql'])
            value = None
        else:
            cursor = connection.execute(request['sql'], request.get('params', []))
            value = [dict(row) for row in cursor.fetchall()] if request['mode'] == 'query' else {'changes': cursor.rowcount, 'lastInsertRowId': cursor.lastrowid}
        print(json.dumps({'id': request['id'], 'value': value}), flush=True)
    except Exception as error:
        print(json.dumps({'id': request['id'], 'error': str(error)}), flush=True)
