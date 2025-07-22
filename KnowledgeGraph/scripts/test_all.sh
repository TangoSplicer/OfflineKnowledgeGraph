#!/bin/bash
echo "[TEST] Running logic tests..."

# Check if Mercury is installed
if ! command -v mmc &> /dev/null; then
    echo "Mercury compiler (mmc) is not installed."
    echo "Please install Mercury from https://mercurylang.org/download/ and try again."
    exit 1
fi

# Go up one level and then into mercury_infer
cd ../mercury_infer || { echo "Directory '../mercury_infer' not found."; exit 1; }

mmc --make test.assert && ./test_assert
