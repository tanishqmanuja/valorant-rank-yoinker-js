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
	VRYJS_BUNDLE_PATH = "bin/vryjs.mjs"
)

func EnsureVryJSBundleExists() error {

	if utils.FileExists(VRYJS_BUNDLE_PATH) {
		return nil
	}

	fmt.Println("==> Downloading Latest VryJS Release")
	version, err_gh := github.DownloadLatestRelease(constants.REPOSITORY, "vryjs.mjs", VRYJS_BUNDLE_PATH)
	if err_gh == nil {
		fmt.Printf("==> VryJS %s bundle written [Github]", version)
		fmt.Print("\n")
		return nil
	}

	fmt.Println("==> Unable to download release from Github")

	return WriteFallbackVryJSBundle()
}

func GetVryJSBundleVersion() (string, error) {
	cmd := exec.Command(NODE_BINARY_PATH, "--no-warnings", VRYJS_BUNDLE_PATH, "version")

	stdout, err := cmd.Output()

	if err != nil {
		return "", err
	}

	return strings.Trim(string(stdout), " \t\n\r"), nil
}

func RunVryJS() {
	cmd := exec.Command(NODE_BINARY_PATH, "--no-warnings", VRYJS_BUNDLE_PATH)
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

func RunVryJSCliCommand(command string) {
	cmd := exec.Command(NODE_BINARY_PATH, "--no-warnings", VRYJS_BUNDLE_PATH, command)
	cmd.Stdin = os.Stdin
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	cmd.Env = os.Environ()

	err := cmd.Run()

	if err != nil {
		os.Exit(1)
	}

	os.Exit(0)
}

func UpdateVryJSBundle() error {
	if utils.FileExists(VRYJS_BUNDLE_PATH) {
		bundleVersion, err := GetVryJSBundleVersion()

		if err != nil {
			return err
		}

		latestRelease, err := github.GetLatestRelease(constants.REPOSITORY)

		if err != nil {
			return err
		}

		bundleVersion = fmt.Sprintf("v%s", bundleVersion)
		upstreamVersion := latestRelease.GetTagName()

		if semver.Compare(upstreamVersion, bundleVersion) < 1 {
			fmt.Println("==> VryJS Bundle is already up to date.")
			return nil
		}

		fmt.Printf("==> Updating VryJS Bundle %s to %s\n", bundleVersion, upstreamVersion)

		err = os.Remove(VRYJS_BUNDLE_PATH)
		if err != nil {
			return err
		}
	}

	return EnsureVryJSBundleExists()
}

func WriteFallbackVryJSBundle() error {
	// Create the directory structure if it doesn't exist
	if err := os.MkdirAll(filepath.Dir(VRYJS_BUNDLE_PATH), 0755); err != nil {
		return err
	}

	err_fs := os.WriteFile(VRYJS_BUNDLE_PATH, imports.FallbackVryJSBundle, 0644)
	if err_fs != nil {
		fmt.Println("==> Unable to write fallback VryJS Bundle.")
		fmt.Print("\n")
		return err_fs
	}

	fmt.Printf("==> VryJS v%s bundle written [Fallback]\n", constants.VERSION)
	fmt.Print("\n")
	return nil
}
