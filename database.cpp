#include "database.h"
#include <ctime>
#include <iomanip>
#include <iostream>
#include <sstream>

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