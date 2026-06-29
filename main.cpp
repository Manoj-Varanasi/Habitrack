#include <iostream>
#include "database.h"
#include "httplib.h"
#include "sqlite3.h"

using namespace std;

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