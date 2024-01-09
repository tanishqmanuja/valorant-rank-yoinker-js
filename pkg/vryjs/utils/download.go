package utils

import (
	"fmt"
	"time"

	"github.com/cavaliergopher/grab/v3"
	"github.com/schollz/progressbar/v3"
)

// DownloadFile downloads a file from the given URL and displays the progress.
func DownloadFileWithProgress(url string, filePath string) error {
	req, err := grab.NewRequest(filePath, url)

	if err != nil {
		return err
	}

	resp := grab.DefaultClient.Do(req)

	// fmt.Println("Downloading", url, "to", filePath)
	// fmt.Println("size",int(resp.Size()))

	bar := progressbar.NewOptions(
		int(resp.Size()),
    progressbar.OptionEnableColorCodes(true),
		progressbar.OptionShowCount(),
    progressbar.OptionShowBytes(true),
    progressbar.OptionSetWidth(10),
		progressbar.OptionThrottle(65*time.Millisecond),
		progressbar.OptionSetDescription("Downloading"),
		progressbar.OptionSetRenderBlankState(true),
		progressbar.OptionSpinnerType(14),
		progressbar.OptionOnCompletion(func() {
			fmt.Printf("\n")
		}),
		progressbar.OptionSetTheme(progressbar.Theme{
			Saucer:        "[green]=[reset]",
			SaucerHead:    "[green]>[reset]",
			SaucerPadding: " ",
			BarStart:      "[",
			BarEnd:        "]",
		}),
	)

	progress := 0
	for !resp.IsComplete() {
		select {
		case <-resp.Done:
			// Download completed
			bar.Finish()
			return nil
		default:
			// Update progress bar
			newProgress := int(resp.BytesComplete())
			bar.Add(newProgress - progress)
			progress = newProgress
		}
	}

	
	return bar.Finish()
}