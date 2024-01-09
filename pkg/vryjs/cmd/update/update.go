package update

import (
	"fmt"
	"os"
	"vryjs/pkg/vryjs/internal"

	"github.com/spf13/cobra"
)

func UpdateCommand() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "update",
		Short: "Update to latest version",
		Long:  "Updates vryjs binary to the latest version.",
		Run: func(cmd *cobra.Command, args []string) {
			err := internal.UpdateVryJSBundle()
			if err != nil {
				fmt.Printf("Error: %s\n", err)
				os.Exit(1)
			}
		},
	}

	return cmd
}
