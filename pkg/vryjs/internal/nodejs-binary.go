package internal

import (
	"fmt"
	"path/filepath"
	"strings"
	"vryjs/pkg/vryjs/constants"
	"vryjs/pkg/vryjs/github"
	"vryjs/pkg/vryjs/utils"
)

const (
	FALLBACK_NODE_VERSION = "v21.2.0"
)

var (
	NODE_BINARY_PATH = filepath.Join(constants.ROOT_DIR, "bin/node.exe")
)

func EnsureNodeBinaryExists() error {
	if utils.FileExists(NODE_BINARY_PATH) {
		return nil
	}

	nodeVersion := FALLBACK_NODE_VERSION
	nodeTag := `[Fallback]`
	if version, err := github.FetchFileContents(constants.REPOSITORY, ".node-version"); err == nil {
		nodeVersion = strings.Trim(version, " \t\n\r")
		nodeTag = `[Github]`
	}

	url := fmt.Sprintf("https://nodejs.org/dist/%s/win-x64/node.exe", nodeVersion)

	fmt.Println("==> Fetching NodeJS", nodeVersion)
	err := utils.DownloadFileWithProgress(url, NODE_BINARY_PATH)
	if err != nil {
		fmt.Println("==> Unable to download NodeJS")
		fmt.Print("\n")
		return err
	}

	fmt.Println("==> NodeJS binary written", nodeTag)
	fmt.Print("\n")
	return nil
}
