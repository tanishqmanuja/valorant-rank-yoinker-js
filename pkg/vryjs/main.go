package main

import (
	"vryjs/pkg/vryjs/cmd/root"

	"github.com/spf13/cobra"
)

func init() {
	// Allows to run exe by double clicking on Windows
	cobra.MousetrapHelpText = ""
}

func main() {
	rootCmd := root.RootCommand()

	rootCmd.CompletionOptions.HiddenDefaultCmd = true

	if err := rootCmd.Execute(); err != nil {
		panic(err)
	}
}
