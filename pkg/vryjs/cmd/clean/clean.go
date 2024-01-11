package clean

import (
	"fmt"
	"os"
	"vryjs/pkg/vryjs/internal"

	"github.com/spf13/cobra"
)

func CleanCommand() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "clean",
		Short: "Cleans VryJS Cache",
		Long:  "Cleans VryJS Cache",
		Run: func(cmd *cobra.Command, args []string) {
			if _, err := internal.GetVryJSBundleVersion(); err != nil {
				fmt.Print("Cannot clean without VryJS Bundle")
				os.Exit(1)
			}

			internal.RunVryJSCliCommand("clean")
		},
	}

	return cmd
}
