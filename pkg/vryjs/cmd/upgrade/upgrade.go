package upgrade

import (
	"fmt"
	"os"
	"vryjs/pkg/vryjs/internal"

	"github.com/spf13/cobra"
)

func UpgradeCommand() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "upgrade",
		Short: "Upgrade to latest version",
		Long:  "Upgrades vryjs cli binary to the latest version.",
		Run: func(cmd *cobra.Command, args []string) {
			err := internal.UpdateSelf()
			if err != nil {
				fmt.Printf("Error: %s\n", err)
				os.Exit(1)
			}
		},
	}

	return cmd
}
