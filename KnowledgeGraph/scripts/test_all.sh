# project_root/scripts/test_all.sh
#!/bin/bash
echo "[TEST] Running logic tests..."
cd mercury_engine && mmc --make test.assert && ./test_assert