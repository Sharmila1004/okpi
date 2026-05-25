@echo off
chcp 65001 >nul
echo Stopping existing compose...
docker-compose down --remove-orphans

echo Building (output -> build_output.log)...
docker-compose build --no-cache > "%~dp0build_output.log" 2>&1 || echo Build stage failed (see build_output.log)

echo Bringing up (output -> up_output.log)...
docker-compose up --build > "%~dp0up_output.log" 2>&1 || echo Up stage failed (see up_output.log)

echo Capturing docker-compose ps -> ps_output.log
docker-compose ps --all > "%~dp0ps_output.log" 2>&1

echo Collecting service logs -> all_service_logs.log
> "%~dp0all_service_logs.log" echo === Service logs collected at %date% %time% ===
for %%s in (discovery-server auth-service objective-service kpi-service api-gateway mysql-auth mysql-objective mysql-kpi) do (
  echo ====== %%s ====== >> "%~dp0all_service_logs.log"
  docker-compose logs --tail 200 %%s >> "%~dp0all_service_logs.log" 2>&1
)

echo Done. Review the log files in this folder: build_output.log, up_output.log, ps_output.log, all_service_logs.log
echo Paste their contents here and I'll fix remaining issues.