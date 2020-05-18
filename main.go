package main

import (
	"grpcwebman/internal/backend"

	"github.com/leaanthony/mewn"
	"github.com/wailsapp/wails"
)

func main() {

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
