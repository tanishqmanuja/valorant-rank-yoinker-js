package constants

import "github.com/kardianos/osext"

const (
	REPO_OWNER = "tanishqmanuja"
	REPO_NAME  = "valorant-rank-yoinker-js"
)

var (
	VERSION    = "0.0.0"
	REPOSITORY = struct {
		Owner string
		Name  string
	}{
		Owner: REPO_OWNER,
		Name:  REPO_NAME,
	}
	ROOT_DIR, _ = osext.ExecutableFolder()
)
