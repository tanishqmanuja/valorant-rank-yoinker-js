package internal

import (
	"os"
	"path/filepath"
	imports "vryjs"
	"vryjs/pkg/vryjs/constants"
	"vryjs/pkg/vryjs/utils"
)

var (
	LIBSQL_BINARY_PATH = filepath.Join(constants.ROOT_DIR, "bin/libsql.node")
)

func EnsureLibSQLBinaryExists() error {
	if utils.FileExists(LIBSQL_BINARY_PATH) {
		return nil
	}
	return WriteFallbackLibSQLBinary()
}

func WriteFallbackLibSQLBinary() error {
	if err := os.MkdirAll(filepath.Dir(LIBSQL_BINARY_PATH), 0755); err != nil {
		return err
	}
	return os.WriteFile(LIBSQL_BINARY_PATH, imports.LibSQLBinary, 0644)
}
