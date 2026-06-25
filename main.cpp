#include <bits/stdc++.h>
#include "httplib.h"
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

void listHabits(sqlite3* db) {
    string sql = "select id,name from habits";
    sqlite3_stmt* stmt = nullptr;
    int rc = sqlite3_prepare_v2(db, sql.c_str(), -1, &stmt, nullptr);
    if (rc != SQLITE_OK) {
        cout << "Failed to prepare select statement : " << sqlite3_errmsg(db) << endl;
        return;
    }
    cout << "---Habits list---\n";
    while (sqlite3_step(stmt) == SQLITE_ROW) {
        int id = sqlite3_column_int(stmt, 0);
        const unsigned char* name = sqlite3_column_text(stmt, 1);
        cout << id << ". " << name << endl;
    }
    sqlite3_finalize(stmt);
}

void clearHabits(sqlite3* db) {
    string sql = R"(
        delete from habits;
        delete from sqlite_sequence where name='habits';
    )";
    char* errMsg = nullptr;
    int rc = sqlite3_exec(db, sql.c_str(), nullptr, nullptr, &errMsg);
    if (rc != SQLITE_OK) {
        cout << "Failed to clear habits: " << errMsg << endl;
        sqlite3_free(errMsg);
        return;
    }
    cout << "All habits cleared successfully!" << endl;
}

string getHabits(sqlite3* db) {
    string sql = "select id,name from habits;";
    sqlite3_stmt* stmt = nullptr;
    int rc = sqlite3_prepare_v2(db, sql.c_str(), -1, &stmt, nullptr);
    if (rc != SQLITE_OK) {
        return "Failed to fetch Habits " + string(sqlite3_errmsg(db));
    }
    string result = "--- Habits List ---\n";
    bool hasHabits = false;
    while (sqlite3_step(stmt) == SQLITE_ROW) {
        hasHabits = true;
        int id = sqlite3_column_int(stmt, 0);
        const unsigned char* name = sqlite3_column_text(stmt, 1);
        result += to_string(id) + ". " + string((const char*)name) + "\n";
    }
    if (!hasHabits) {
        result += "No habits added yet\n";
    }
    sqlite3_finalize(stmt);
    return result;
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
    httplib::Server svr;
    svr.Get("/", [](const httplib::Request& req, httplib::Response& res) {
        res.set_content("Hello Worurdo", "text/plain");
    });
    svr.Get("/habits", [db](const httplib::Request& req, httplib::Response& res) {
        string list = getHabits(db);
        res.set_content(list, "text/plain");
    });

    svr.Post("/api/add", [db](const httplib::Request& req, httplib::Response& res) {
        if (!req.has_param("name")) {
            res.status = 400;
            res.set_content("Missing 'name' parameter", "text/plain");
            return;
        }
        string name = req.get_param_value("name");
        addHabit(db, name);
        res.set_content("Habit '" + name + "' added successfully!", "text/plain");
    });

    svr.Post("/api/delete", [db](const httplib::Request& req, httplib::Response& res) {
        if (!req.has_param("name")) {
            res.status = 400;
            res.set_content("Missing 'name' parameter", "text/plain");
            return;
        }
        string name = req.get_param_value("name");
        deleteHabit(db, name);
        res.set_content("Habit '" + name + "' is deleted successfully", "text/plain");
    });

    cout << "Server is starting at http://localhost:8080 \n";
    svr.listen("localhost", 8080);
    sqlite3_close(db);
}