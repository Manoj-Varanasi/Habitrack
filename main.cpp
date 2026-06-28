#include <bits/stdc++.h>
#include "httplib.h"
#include "sqlite3.h"
using namespace std;

string getTodayDate() {
    time_t t = time(nullptr);
    tm* now = localtime(&t);
    stringstream ss;
    ss << put_time(now, "%Y-%m-%d");
    return ss.str();
}

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
        delete from completions;
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

string getHabits(sqlite3* db, const string& date) {
    string sql = "select habits.id,habits.name,completions.date from habits left join completions on habits.id=completions.habit_id and completions.date=?;";
    sqlite3_stmt* stmt = nullptr;
    int rc = sqlite3_prepare_v2(db, sql.c_str(), -1, &stmt, nullptr);
    if (rc != SQLITE_OK) {
        return "Failed to fetch Habits " + string(sqlite3_errmsg(db));
    }
    string result = "[";
    bool first = true;
    sqlite3_bind_text(stmt, 1, date.c_str(), -1, SQLITE_TRANSIENT);
    bool hasHabits = false;
    while (sqlite3_step(stmt) == SQLITE_ROW) {
        hasHabits = true;
        if (!first) {
            result += ",";
        }
        first = false;
        int id = sqlite3_column_int(stmt, 0);
        const unsigned char* name = sqlite3_column_text(stmt, 1);
        bool completed = (sqlite3_column_type(stmt, 2) != SQLITE_NULL);
        result += "{\"id\":" + to_string(id) + ",\"name\":\"" + string((const char*)name) + "\",\"completed\":" + (completed ? "true" : "false") + "}";
    }
    result += "]";
    sqlite3_finalize(stmt);
    return result;
}

void completeHabit(sqlite3* db, int habitId, string& date) {
    string sql = "insert into completions (habit_id,date) values (?,?);";
    sqlite3_stmt* stmt = nullptr;
    int rc = sqlite3_prepare(db, sql.c_str(), -1, &stmt, nullptr);
    if (rc != SQLITE_OK) {
        cout << "Failed to prepare completion : " << sqlite3_errmsg(db) << endl;
        return;
    }
    sqlite3_bind_int(stmt, 1, habitId);
    sqlite3_bind_text(stmt, 2, date.c_str(), -1, SQLITE_TRANSIENT);
    rc = sqlite3_step(stmt);
    if (rc == SQLITE_DONE) {
        cout << "Habit marked completed successfully!" << endl;
    } else {
        cout << "Failed to complete habit: " << sqlite3_errmsg(db) << endl;
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
        create table if not exists completions (
            habit_id integer,
            date text,
            primary key(habit_id,date),
            foreign key (habit_id) references habits(id) on delete cascade
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
        string date = getTodayDate();
        if (req.has_param("date")) {
            date = req.get_param_value("date");
        }
        string list = getHabits(db, date);
        res.set_content(list, "application/json");
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

    svr.Post("/api/clear", [db](const httplib::Request& req, httplib::Response& res) {
        clearHabits(db);
        res.set_content("All habits and completions cleared successfully!", "text/plain");
    });

    svr.Post("/api/complete", [db](const httplib::Request& req, httplib::Response& res) {
        if (!req.has_param("id") || !req.has_param("date")) {
            res.status = 400;
            res.set_content("Missing 'id' or 'date' parameter", "text/plain");
            return;
        }
        int habitId = stoi(req.get_param_value("id"));
        string date = req.get_param_value("date");
        completeHabit(db, habitId, date);
        res.set_content("Habit marked completed successfully!", "text/plain");
    });

    cout << "Server is starting at http://localhost:8080 \n";
    svr.listen("localhost", 8080);
    sqlite3_close(db);
}