"""SQLite FTS5 Zero-Embedding Search Engine for Lex Agentica.
Provides instant, low-latency, zero-cost keyword and token search for Sibyl's 5-Tier Memory.
"""

import json
import sqlite3
import threading
from pathlib import Path
from typing import Any, Dict, List, Optional
import time


class FTSStore:
    def __init__(self, db_path: str = ":memory:"):
        self.db_path = db_path
        self._lock = threading.Lock()
        self._conn = sqlite3.connect(self.db_path, check_same_thread=False)
        self._conn.row_factory = sqlite3.Row
        self._init_db()

    def _init_db(self):
        with self._lock:
            cursor = self._conn.cursor()
            # Create standard table for structured records
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS memory_records (
                    id TEXT PRIMARY KEY,
                    tier TEXT NOT NULL,
                    title TEXT NOT NULL,
                    content TEXT NOT NULL,
                    entity_id TEXT,
                    tags TEXT,
                    metadata_json TEXT,
                    created_at TEXT NOT NULL
                )
            """)
            
            # Create FTS5 virtual table for zero-embedding full-text search
            cursor.execute("""
                CREATE VIRTUAL TABLE IF NOT EXISTS memory_fts USING fts5(
                    id UNINDEXED,
                    tier,
                    title,
                    content,
                    entity_id,
                    tags,
                    tokenize = 'porter unicode61'
                )
            """)
            self._conn.commit()

    def insert_record(
        self,
        record_id: str,
        tier: str,
        title: str,
        content: str,
        entity_id: Optional[str] = None,
        tags: Optional[List[str]] = None,
        metadata: Optional[Dict[str, Any]] = None,
        created_at: Optional[str] = None
    ) -> None:
        tags_str = " ".join(tags or [])
        meta_str = json.dumps(metadata or {})
        created_at_str = created_at or time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

        with self._lock:
            cursor = self._conn.cursor()
            # Insert or replace in base table
            cursor.execute("""
                INSERT OR REPLACE INTO memory_records (id, tier, title, content, entity_id, tags, metadata_json, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (record_id, tier, title, content, entity_id or "", tags_str, meta_str, created_at_str))

            # Delete existing in FTS then insert
            cursor.execute("DELETE FROM memory_fts WHERE id = ?", (record_id,))
            cursor.execute("""
                INSERT INTO memory_fts (id, tier, title, content, entity_id, tags)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (record_id, tier, title, content, entity_id or "", tags_str))

            self._conn.commit()

    def delete_record(self, record_id: str) -> None:
        with self._lock:
            cursor = self._conn.cursor()
            cursor.execute("DELETE FROM memory_records WHERE id = ?", (record_id,))
            cursor.execute("DELETE FROM memory_fts WHERE id = ?", (record_id,))
            self._conn.commit()

    def clear_tier(self, tier: str) -> None:
        with self._lock:
            cursor = self._conn.cursor()
            cursor.execute("DELETE FROM memory_records WHERE tier = ?", (tier,))
            cursor.execute("DELETE FROM memory_fts WHERE tier = ?", (tier,))
            self._conn.commit()

    def clear_all(self) -> None:
        with self._lock:
            cursor = self._conn.cursor()
            cursor.execute("DELETE FROM memory_records")
            cursor.execute("DELETE FROM memory_fts")
            self._conn.commit()

    def search(
        self,
        query: str,
        tier: Optional[str] = None,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        start_time = time.perf_counter()
        results: List[Dict[str, Any]] = []

        cleaned_tokens = [f'"{token}"' for token in query.replace('"', '').split() if token.strip()]
        fts_query = " OR ".join(cleaned_tokens) if cleaned_tokens else '""'

        with self._lock:
            cursor = self._conn.cursor()
            try:
                if tier:
                    sql = """
                        SELECT r.id, r.tier, r.title, r.content, r.entity_id, r.tags, r.metadata_json, r.created_at,
                               bm25(memory_fts) as rank
                        FROM memory_fts f
                        JOIN memory_records r ON f.id = r.id
                        WHERE memory_fts MATCH ? AND r.tier = ?
                        ORDER BY rank
                        LIMIT ?
                    """
                    cursor.execute(sql, (fts_query, tier, limit))
                else:
                    sql = """
                        SELECT r.id, r.tier, r.title, r.content, r.entity_id, r.tags, r.metadata_json, r.created_at,
                               bm25(memory_fts) as rank
                        FROM memory_fts f
                        JOIN memory_records r ON f.id = r.id
                        WHERE memory_fts MATCH ?
                        ORDER BY rank
                        LIMIT ?
                    """
                    cursor.execute(sql, (fts_query, limit))
                
                rows = cursor.fetchall()
            except (sqlite3.OperationalError, sqlite3.DatabaseError):
                wildcard = f"%{query}%"
                if tier:
                    cursor.execute("""
                        SELECT id, tier, title, content, entity_id, tags, metadata_json, created_at, 0 as rank
                        FROM memory_records
                        WHERE (title LIKE ? OR content LIKE ? OR tags LIKE ? OR entity_id LIKE ?) AND tier = ?
                        LIMIT ?
                    """, (wildcard, wildcard, wildcard, wildcard, tier, limit))
                else:
                    cursor.execute("""
                        SELECT id, tier, title, content, entity_id, tags, metadata_json, created_at, 0 as rank
                        FROM memory_records
                        WHERE title LIKE ? OR content LIKE ? OR tags LIKE ? OR entity_id LIKE ?
                        LIMIT ?
                    """, (wildcard, wildcard, wildcard, wildcard, limit))
                rows = cursor.fetchall()

            elapsed_ms = (time.perf_counter() - start_time) * 1000.0

            for row in rows:
                tags = row["tags"].split() if row["tags"] else []
                meta = json.loads(row["metadata_json"]) if row["metadata_json"] else {}
                results.append({
                    "id": row["id"],
                    "tier": row["tier"],
                    "title": row["title"],
                    "content": row["content"],
                    "entity_id": row["entity_id"],
                    "tags": tags,
                    "metadata": meta,
                    "created_at": row["created_at"],
                    "score": float(row["rank"]) if "rank" in row.keys() else 0.0,
                    "search_ms": elapsed_ms
                })

        return results

    def get_records_by_tier(self, tier: str, limit: int = 50) -> List[Dict[str, Any]]:
        with self._lock:
            cursor = self._conn.cursor()
            cursor.execute("""
                SELECT id, tier, title, content, entity_id, tags, metadata_json, created_at
                FROM memory_records
                WHERE tier = ?
                ORDER BY created_at DESC
                LIMIT ?
            """, (tier, limit))
            rows = cursor.fetchall()
            
            results = []
            for row in rows:
                tags = row["tags"].split() if row["tags"] else []
                meta = json.loads(row["metadata_json"]) if row["metadata_json"] else {}
                results.append({
                    "id": row["id"],
                    "tier": row["tier"],
                    "title": row["title"],
                    "content": row["content"],
                    "entity_id": row["entity_id"],
                    "tags": tags,
                    "metadata": meta,
                    "created_at": row["created_at"]
                })
            return results

    def count_by_tier(self) -> Dict[str, int]:
        with self._lock:
            cursor = self._conn.cursor()
            cursor.execute("SELECT tier, COUNT(*) as count FROM memory_records GROUP BY tier")
            rows = cursor.fetchall()
            counts = {"HOT": 0, "WARM": 0, "COLD": 0, "REFERENCE": 0, "ARCHIVE": 0}
            for row in rows:
                counts[row["tier"]] = row["count"]
            return counts

    def close(self):
        with self._lock:
            self._conn.close()
