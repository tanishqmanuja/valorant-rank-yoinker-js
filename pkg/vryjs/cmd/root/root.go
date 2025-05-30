package root

import (
	_ "embed"
	"fmt"
	"os"
	"vryjs/pkg/vryjs/cmd/clean"
	"vryjs/pkg/vryjs/cmd/update"
	"vryjs/pkg/vryjs/cmd/upgrade"
	"vryjs/pkg/vryjs/cmd/version"
	"vryjs/pkg/vryjs/constants"
	"vryjs/pkg/vryjs/internal"

	"github.com/spf13/cobra"
	"golang.org/x/mod/semver"
)

//go:embed banner.txt
var banner string

func RootCommand() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "vryjs",
		Short: "VALORANT Rank Yoinker JS",
		Long:  "VALORANT Rank Yoinker JS",
		Run: func(cmd *cobra.Command, args []string) {
			fmt.Print(banner)

			if err := internal.EnsureNodeBinaryExists(); err != nil {
				os.Exit(1)
			}

			if err := internal.EnsureVryJSBundleExists(); err != nil {
				os.Exit(1)
			}

			if err := internal.EnsureLibSQLBinaryExists(); err != nil {
				os.Exit(1)
			}

			if bundleVersion, err := internal.GetVryJSBundleVersion(); err != nil {
				fmt.Println("==> Unable to read bundle version, bundle may be corrupt.")
				os.Exit(1)
			} else {
				localVersion := fmt.Sprintf("v%s", constants.VERSION)
				bundleVersion = fmt.Sprintf("v%s", bundleVersion)
				if semver.Compare(localVersion, bundleVersion) > 0 {
					internal.WriteFallbackVryJSBundle()
				}
			}

			internal.RunVryJS()
		},
	}

	cmd.AddCommand(version.VersionCommand())
	cmd.AddCommand(update.UpdateCommand())
	cmd.AddCommand(upgrade.UpgradeCommand())
	cmd.AddCommand(clean.CleanCommand())

	return cmd
}
