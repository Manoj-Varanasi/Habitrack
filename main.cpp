#include <bits/stdc++.h>
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
    )";
    char* errMsg = nullptr;
    rc = sqlite3_exec(db, sql.c_str(), nullptr, nullptr, &errMsg);
    if(rc!=SQLITE_OK){
        cout<<"Error in SQL : "<<errMsg<<endl;
        sqlite3_free(errMsg);
        sqlite3_close(db);
        return 1;
    }
    cout<<"Table created successfully"<<endl;
    sqlite3_close(db);
}