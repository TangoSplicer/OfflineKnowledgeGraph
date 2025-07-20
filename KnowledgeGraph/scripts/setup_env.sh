# project_root/scripts/setup_env.sh
#!/bin/bash
echo "[ENV] Setting up KnowledgeGraph dev environment..."
./gradlew clean
./gradlew build