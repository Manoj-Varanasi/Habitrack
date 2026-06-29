g++ -D_WIN32_WINNT=0x0A00 main.cpp database.cpp sqlite3.o -o main.exe -lws2_32
if %errorlevel% neq 0 (
    exit /b %errorlevel%
)
main.exe