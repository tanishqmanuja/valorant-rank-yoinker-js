package root

import (
	_ "embed"
	"fmt"
	"os"
	"vryjs/pkg/vryjs/cmd/update"
	"vryjs/pkg/vryjs/internal"

	"github.com/spf13/cobra"
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

			if err := internal.EnsureVryJSBinaryExists(); err != nil {
				os.Exit(1)
			}

			internal.RunVryJS()
		},
	}

	cmd.AddCommand(update.UpdateCommand())

	return cmd
}
