package main

import (
	"bytes"
	"context"
	"fmt"
	"log"

	"github.com/golang/protobuf/jsonpb"
	"github.com/place1/grpc-web-man/grpcweb"

	"github.com/jhump/protoreflect/desc/protoparse"

	"github.com/jhump/protoreflect/dynamic"
)

var unmarshaler = &jsonpb.Unmarshaler{
	// AnyResolver: dynamic.AnyResolver(nil, method.GetFile()),
}

var marshaler = &jsonpb.Marshaler{}

func main() {
	ctx := context.Background()

	parser := protoparse.Parser{}
	descriptors, err := parser.ParseFiles("example-server/example.proto")
	if err != nil {
		log.Fatal(err)
	}

	service := descriptors[0].FindService(fmt.Sprintf("%s.%s", descriptors[0].GetPackage(), "Greeter"))
	if service == nil {
		log.Fatal("service not found")
	}

	method := service.FindMethodByName("SayHello")
	if method == nil {
		log.Fatal("method not found")
	}

	// msgFactory := dynamic.NewMessageFactoryWithExtensionRegistry(&dynamic.ExtensionRegistry{})
	// msg := msgFactory.NewMessage(method.GetInputType())
	msg := dynamic.NewMessage(method.GetInputType())

	data := []byte(`
		{
			"name": "James"
		}
	`)

	if unmarshaler.Unmarshal(bytes.NewReader(data), msg); err != nil {
		log.Fatal(err)
	}

	client := grpcweb.NewClient("http://localhost:8000")

	res, err := client.InvokeRPC(ctx, method, msg)
	if err != nil {
		log.Fatal(err)
	}

	s, err := marshaler.MarshalToString(res)
	if err != nil {
		log.Fatal(err)
	}

	fmt.Println(s)
}
