package github

import (
	"fmt"
	"vryjs/pkg/vryjs/utils"

	"github.com/go-resty/resty/v2"
)

type Repo struct{
	Owner string
	Name string
}

func FetchFileContents(repo Repo, filepath string) (string, error) {
	url := fmt.Sprintf("https://raw.githubusercontent.com/%s/%s/main/%s", repo.Owner, repo.Name,filepath)

	resp, err := resty.New().R().Get(url)
	if err != nil {
		return "", err
	}

	if resp.StatusCode() != 200 {
		return "", fmt.Errorf("failed to fetch content. Status code: %d", resp.StatusCode())
	}

	return string(resp.Body()), nil
}

func DownloadFile(repo Repo, filepath ,downloadpath string) error {
	url := fmt.Sprintf("https://raw.githubusercontent.com/%s/%s/main/%s", repo.Owner, repo.Name,filepath)
	return utils.DownloadFileWithProgress(url, downloadpath)
}