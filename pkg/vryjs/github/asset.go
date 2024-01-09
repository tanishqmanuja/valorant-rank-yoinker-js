package github

import (
	"context"
	"fmt"
	"vryjs/pkg/vryjs/constants"
	"vryjs/pkg/vryjs/utils"

	gh "github.com/google/go-github/v57/github"
)

func GetLatestRelease(repo Repo, assetName string) (*gh.RepositoryRelease, error) {
	client := gh.NewClient(nil)

	release, _, err := client.Repositories.GetLatestRelease(context.Background(), constants.REPO_OWNER, constants.REPO_NAME)

	if err != nil {
		return nil, err
	}

	return release, nil
}

func DownloadLatestRelease(repo Repo, assetName, downloadpath string) error {
	client := gh.NewClient(nil)

	release, _, err := client.Repositories.GetLatestRelease(context.Background(), constants.REPO_OWNER, constants.REPO_NAME)

	if err != nil {
		return err
	}

	// Find the asset by name
	var asset *gh.ReleaseAsset
	for _, a := range release.Assets {
		if *a.Name == assetName {
			asset = a
			break
		}
	}

	if asset == nil {
		return fmt.Errorf("asset not found")
	}

	return utils.DownloadFileWithProgress(*asset.BrowserDownloadURL, downloadpath)
}
