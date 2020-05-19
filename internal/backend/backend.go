package backend

import (
	"context"
	"fmt"
	"grpcwebman/internal/grpcweb"
	"io"
	"io/ioutil"
	"strings"

	"github.com/golang/protobuf/jsonpb"
	"github.com/jhump/protoreflect/desc"
	"github.com/jhump/protoreflect/desc/protoparse"
	"github.com/jhump/protoreflect/dynamic"
	"github.com/mitchellh/mapstructure"
	"github.com/pkg/errors"
	"github.com/wailsapp/wails"
)

type Domain struct {
	runtime *wails.Runtime
}

func NewDomain() *Domain {
	return &Domain{}
}

func (d *Domain) WailsInit(runtime *wails.Runtime) error {
	d.runtime = runtime
	return nil
}

func (d *Domain) ListMethods(files []interface{}) ([]string, error) {
	protofiles := []*FileModel{}
	if err := mapstructure.Decode(files, &protofiles); err != nil {
		return nil, errors.Wrap(err, "invalid argument")
	}

	methodDescriptors, err := listMethods(protofiles)
	if err != nil {
		return nil, err
	}

	methods := []string{}
	for _, method := range methodDescriptors {
		methods = append(methods, method.GetFullyQualifiedName())
	}

	return methods, nil
}

func (d *Domain) InvokeRPC(files []interface{}, server string, method string, data string) (string, error) {
	protofiles := []*FileModel{}
	if err := mapstructure.Decode(files, &protofiles); err != nil {
		return "", errors.Wrap(err, "invalid argument")
	}

	methods, err := listMethods(protofiles)
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

func listMethods(protofiles []*FileModel) ([]*desc.MethodDescriptor, error) {
	if len(protofiles) == 0 {
		return nil, errors.New("select your proto file(s) first")
	}

	parser := protoparse.Parser{
		Accessor: func(filename string) (io.ReadCloser, error) {
			for _, f := range protofiles {
				if strings.HasSuffix(filename, f.Name) {
					return ioutil.NopCloser(strings.NewReader(f.Content)), nil
				}
			}
			return nil, fmt.Errorf("protofile not found: %s", filename)
		},
	}

	fnames := []string{}
	for _, f := range protofiles {
		fnames = append(fnames, f.Name)
	}

	descriptors := []*desc.FileDescriptor{}
	for _, f := range protofiles {
		descs, err := parser.ParseFiles(f.Name)
		if err != nil {
			return nil, errors.Wrap(err, "failed to parse proto file")
		}
		descriptors = append(descriptors, descs...)
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

type FileModel struct {
	Name    string
	Content string
}
