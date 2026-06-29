#ifndef DATABASE_H
#define DATABASE_H

#include <string>
#include "sqlite3.h"

std::string getTodayDate();
void addHabit(sqlite3* db, const std::string& habitName);
void deleteHabit(sqlite3* db, const std::string& habitName);
void clearHabits(sqlite3* db);
std::string getHabits(sqlite3* db, const std::string& date);
void completeHabit(sqlite3* db, int habitId, std::string& date);

#endif