@echo off
for /f "tokens=*" %%i in ('type .env ^| findstr /v /b "#"') do (
    for /f "tokens=1* delims==" %%a in ("%%i") do (
        set "%%a=%%b"
    )
)
echo Loaded environment variables from .env (if present).
mvn spring-boot:run