#include <bits/stdc++.h>
#include "sqlite3.h"
using namespace std;

void addHabit(sqlite3* db, const string& habitName) {
    string sql = "insert into habits (name) values (?);";
    sqlite3_stmt* stmt = nullptr;
    int rc = sqlite3_prepare_v2(db, sql.c_str(), -1, &stmt, nullptr);
    if (rc != SQLITE_OK) {
        cout << "Failed to prepare message: " << sqlite3_errmsg(db) << endl;
        return;
    }
    sqlite3_bind_text(stmt, 1, habitName.c_str(), -1, SQLITE_TRANSIENT);
    rc = sqlite3_step(stmt);
    if (rc == SQLITE_DONE) {
        cout << "Habit added successfully!" << endl;
    } else {
        cout << "Failed to add habit: " << sqlite3_errmsg(db) << endl;
    }
    sqlite3_finalize(stmt);
}

// The Recipe:
// Prepare (make the machinery).
// Bind (load the data securely).
// Step (run the query).
// Finalize (clean up memory).

void deleteHabit(sqlite3* db, const string& habitName) {
    string sql = "delete from habits where name = ?;";
    sqlite3_stmt* stmt = nullptr;
    int rc = sqlite3_prepare_v2(db, sql.c_str(), -1, &stmt, nullptr);
    if (rc != SQLITE_OK) {
        cout << "Failed to prepare delete statement: " << sqlite3_errmsg(db) << endl;
        return;
    }
    sqlite3_bind_text(stmt, 1, habitName.c_str(), -1, SQLITE_TRANSIENT);
    rc = sqlite3_step(stmt);
    if (rc == SQLITE_DONE) {
        cout << "Habit removed successfully!" << endl;
    } else {
        cout << "Failed to remove habit: " << sqlite3_errmsg(db) << endl;
    }
    sqlite3_finalize(stmt);
}

int main() {
    sqlite3* db = nullptr;
    int rc = sqlite3_open("habits.db", &db);
    if (rc != SQLITE_OK) {
        cout << "Failed to open database" << endl;
        return 1;
    }
    cout << "DB opened Successfully" << endl;
    const string sql = R"(
        create table if not exists habits (
            id integer primary key autoincrement,
            name text not null unique
        );
    )";
    char* errMsg = nullptr;
    rc = sqlite3_exec(db, sql.c_str(), nullptr, nullptr, &errMsg);
    if (rc != SQLITE_OK) {
        cout << "Error in SQL : " << errMsg << endl;
        sqlite3_free(errMsg);
        sqlite3_close(db);
        return 1;
    }
    cout << "Table created successfully" << endl;
    addHabit(db, "Reading Book");
    addHabit(db, "Jogging");
    deleteHabit(db, "Jogging");
    sqlite3_close(db);
}