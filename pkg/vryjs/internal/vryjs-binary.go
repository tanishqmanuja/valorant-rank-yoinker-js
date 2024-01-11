package internal

import (
	"bufio"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	imports "vryjs"
	"vryjs/pkg/vryjs/constants"
	"vryjs/pkg/vryjs/github"
	"vryjs/pkg/vryjs/utils"

	"golang.org/x/mod/semver"
)

const (
	VRYJS_BINARY_PATH = "bin/vryjs.mjs"
)

func EnsureVryJSBinaryExists() error {

	if utils.FileExists(VRYJS_BINARY_PATH) {
		return nil
	}

	fmt.Println("==> Downloading Latest VryJS Release")
	err_gh := github.DownloadLatestRelease(constants.REPOSITORY, "vryjs.mjs", VRYJS_BINARY_PATH)
	if err_gh == nil {
		fmt.Println("==> VryJS binary written [Github]")
		fmt.Print("\n")
		return nil
	}

	fmt.Println("==> Unable to download release from Github")

	// Create the directory structure if it doesn't exist
	if err := os.MkdirAll(filepath.Dir(VRYJS_BINARY_PATH), 0755); err != nil {
		return err
	}

	err_fs := os.WriteFile(VRYJS_BINARY_PATH, imports.FallbackVryJSBundle, 0644)
	if err_fs != nil {
		fmt.Println("==> Unable to write fallback VryJS Binary.")
		fmt.Print("\n")
		return err_fs
	}

	fmt.Println("==> VryJS binary written [Fallback]")
	fmt.Print("\n")
	return nil
}

func GetVryJSBundleVersion() (string, error) {
	cmd := exec.Command(NODE_BINARY_PATH, "--no-warnings", VRYJS_BINARY_PATH, "version")

	stdout, err := cmd.Output()

	if err != nil {
		return "", err
	}

	return strings.Trim(string(stdout), " \t\n\r"), nil
}

func RunVryJS() {
	cmd := exec.Command(NODE_BINARY_PATH, "--no-warnings", VRYJS_BINARY_PATH)
	cmd.Stdin = os.Stdin
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	cmd.Env = os.Environ()

	err := cmd.Run()

	fmt.Print("\n")
	fmt.Print("Press 'Enter' to continue...")
	bufio.NewReader(os.Stdin).ReadBytes('\n')

	if err != nil {
		os.Exit(1)
	}

	os.Exit(0)
}

func UpdateVryJSBundle() error {
	if utils.FileExists(VRYJS_BINARY_PATH) {
		oldVersion, err := GetVryJSBundleVersion()

		if err != nil {
			return err
		}

		latestRelease, err := github.GetLatestRelease(constants.REPOSITORY)

		if err != nil {
			return err
		}

		oldVersion = fmt.Sprintf("v%s", oldVersion)
		newVersion := latestRelease.GetTagName()
		if semver.Compare(newVersion, oldVersion) < 1 {
			fmt.Println("==> VryJS is already up to date.")
			return nil
		}

		fmt.Printf("==> Updating VryJS %s to %s\n", oldVersion, newVersion)

		err = os.Remove(VRYJS_BINARY_PATH)
		if err != nil {
			return err
		}

		return EnsureVryJSBinaryExists()
	}

	fmt.Println("==> Downloading Latest VryJS Release")
	err_gh := github.DownloadLatestRelease(constants.REPOSITORY, "vryjs.mjs", VRYJS_BINARY_PATH)
	if err_gh != nil {
		fmt.Println("==> Unable to download release from Github")
		fmt.Print("\n")
		return err_gh
	}

	fmt.Println("==> VryJS binary written [Github]")
	fmt.Print("\n")
	return nil
}
