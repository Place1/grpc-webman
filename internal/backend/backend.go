package backend

import (
	"context"
	"grpcwebman/internal/grpcweb"
	"io"
	"io/ioutil"
	"strings"

	"github.com/golang/protobuf/jsonpb"
	"github.com/jhump/protoreflect/desc"
	"github.com/jhump/protoreflect/desc/protoparse"
	"github.com/jhump/protoreflect/dynamic"
	"github.com/pkg/errors"
)

type Domain struct{}

func NewDomain() *Domain {
	return &Domain{}
}

func (d *Domain) ListMethods(protofile string) ([]string, error) {
	methodDescriptors, err := listMethods(protofile)
	if err != nil {
		return nil, err
	}

	methods := []string{}
	for _, method := range methodDescriptors {
		methods = append(methods, method.GetFullyQualifiedName())
	}

	return methods, nil
}

func (d *Domain) InvokeRPC(protofile string, server string, method string, data string) (string, error) {
	methods, err := listMethods(protofile)
	if err != nil {
		return "", err
	}

	for _, methodDescriptor := range methods {
		if methodDescriptor.GetFullyQualifiedName() == method {

			msg := dynamic.NewMessage(methodDescriptor.GetInputType())

			unmarshaler := &jsonpb.Unmarshaler{}
			if unmarshaler.Unmarshal(strings.NewReader(data), msg); err != nil {
				return "", errors.Wrap(err, "failed to unmarshal GRPC request message data")
			}

			client := grpcweb.NewClient(server)

			res, err := client.InvokeRPC(context.TODO(), methodDescriptor, msg)
			if err != nil {
				return "", errors.Wrap(err, "failed to invoke GRPC method")
			}

			marshaler := &jsonpb.Marshaler{}
			s, err := marshaler.MarshalToString(res)
			if err != nil {
				return "", errors.Wrap(err, "failed to marshal GRPC response message")
			}

			return s, nil
		}
	}

	return "", errors.New("unknown GRPC method")
}

func listMethods(protofile string) ([]*desc.MethodDescriptor, error) {
	if protofile == "" {
		return nil, errors.New("select a proto file first")
	}

	parser := protoparse.Parser{
		Accessor: func(filename string) (io.ReadCloser, error) {
			return ioutil.NopCloser(strings.NewReader(protofile)), nil
		},
	}

	descriptors, err := parser.ParseFiles("doesn't matter")
	if err != nil {
		return nil, errors.Wrap(err, "failed to parse proto file")
	}

	methods := []*desc.MethodDescriptor{}
	for _, descriptor := range descriptors {
		for _, svc := range descriptor.GetServices() {
			for _, method := range svc.GetMethods() {
				methods = append(methods, method)
			}
		}
	}

	return methods, nil
}
