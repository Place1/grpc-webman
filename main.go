package main

import (
	"grpcwebman/internal/backend"

	"github.com/leaanthony/mewn"
	"github.com/wailsapp/wails"
)

// var (
// 	app    = kingpin.New("wg-access-server", "An all-in-one WireGuard Access Server & VPN solution")
// 	bridge = app.Flag("bridge", "Run wails in bridge mode so that a browser can connect").Bool()
// )

func main() {
	// kingpin.MustParse(app.Parse(os.Args[1:]))

	// if *bridge {
	// wails.BuildMode = cmd.BuildModeBridge
	// }

	js := mewn.String("./frontend/build/static/js/main.js")
	css := mewn.String("./frontend/build/static/css/main.css")

	app := wails.CreateApp(&wails.AppConfig{
		Width:     1024,
		Height:    768,
		Title:     "My Project",
		JS:        js,
		CSS:       css,
		Resizable: true,
	})

	storage := backend.NewStorage()
	defer storage.Close()

	app.Bind(storage)
	app.Bind(backend.NewDomain())

	app.Run()

}
