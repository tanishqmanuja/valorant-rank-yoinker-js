package internal

import (
	"fmt"
	"os"
	"vryjs/pkg/vryjs/constants"
	"vryjs/pkg/vryjs/github"
	"vryjs/pkg/vryjs/utils"

	gh "github.com/google/go-github/v57/github"
	"github.com/inconshreveable/go-update"
	"golang.org/x/mod/semver"
)

func UpdateSelf() error {
	release, err := github.GetLatestRelease(constants.REPOSITORY)

	if err != nil {
		return err
	}

	upstreamVersion := release.GetTagName()
	localVersion := fmt.Sprintf("v%s", constants.VERSION)

	if semver.Compare(upstreamVersion, localVersion) < 1 {
		fmt.Println("==> VryJS CLI is already up to date.")
		return nil
	}

	fmt.Printf("==> Updating VryJS CLI %s to %s\n", localVersion, upstreamVersion)

	var asset *gh.ReleaseAsset
	for _, a := range release.Assets {
		if *a.Name == "vryjs.exe" {
			asset = a
			break
		}
	}

	if asset == nil {
		return fmt.Errorf("asset not found")
	}

	tempPath := os.TempDir() + "/vryjs" + "-" + upstreamVersion + ".exe"
	if err := utils.DownloadFileWithProgress(*asset.BrowserDownloadURL, tempPath); err != nil {
		return err
	}

	fileReader, err := os.Open(tempPath)
	if err != nil {
		return err
	}
	defer fileReader.Close()

	err = update.Apply(fileReader, update.Options{})
	if err != nil {
		return err
	}

	return err
}
