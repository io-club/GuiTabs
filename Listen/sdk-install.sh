#!/bin/bash

# Check if swiftly is installed
if ! command -v swiftly &> /dev/null; then
    echo "swiftly not found. Installing swiftly..."
    curl -L https://swift-server.github.io/swiftly/swiftly-install.sh | bash

    hash -r
fi

swiftly install 6.2-snapshot
swiftly use 6.2-snapshot
swiftly run swift sdk install https://download.swift.org/swift-6.2-branch/wasm-sdk/swift-6.2-DEVELOPMENT-SNAPSHOT-2025-08-01-a/swift-6.2-DEVELOPMENT-SNAPSHOT-2025-08-01-a_wasm.artifactbundle.tar.gz --checksum 40f3c780d4a8f3d369c203615330e1b00441b6f8b7023535bebc16bf4dd5f84a
