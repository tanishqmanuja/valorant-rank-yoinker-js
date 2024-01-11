package version

import (
	"fmt"
	"os"
	"vryjs/pkg/vryjs/constants"
	"vryjs/pkg/vryjs/internal"

	"github.com/spf13/cobra"
)

func VersionCommand() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "version",
		Short: "CLI version",
		Long:  "Shows CLI version.",
		Run: func(cmd *cobra.Command, args []string) {
			fmt.Printf("CLI v%s\n", constants.VERSION)
			if version, err := internal.GetVryJSBundleVersion(); err != nil {
				fmt.Printf("Bundle v%s\n", "UNAVAILABLE")
			} else {
				fmt.Printf("Bundle v%s\n", version)
			}
			os.Exit(0)
		},
	}

	return cmd
}
