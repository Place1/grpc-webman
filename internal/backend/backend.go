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
	"google.golang.org/protobuf/types/descriptorpb"
)

var marshaller = &jsonpb.Marshaler{
	Indent:       "    ",
	EmitDefaults: true,
}

var unmarshaller = &jsonpb.Unmarshaler{}

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

func (d *Domain) InvokeRPC(files []interface{}, server string, method string, data string, metadata map[string]interface{}) (string, error) {
	protofiles := []*FileModel{}
	if err := mapstructure.Decode(files, &protofiles); err != nil {
		return "", errors.Wrap(err, "invalid argument (files)")
	}

	meta := map[string]string{}
	if err := mapstructure.Decode(metadata, &meta); err != nil {
		return "", errors.Wrap(err, "invalid argument (metadata)")
	}

	mdesc, err := findMethod(protofiles, method)
	if err != nil {
		return "", err
	}

	msg := dynamic.NewMessage(mdesc.GetInputType())

	if unmarshaller.Unmarshal(strings.NewReader(data), msg); err != nil {
		return "", errors.Wrap(err, "failed to unmarshal GRPC request message data")
	}

	client := grpcweb.NewClient(server)
	res, err := client.InvokeRPC(context.TODO(), mdesc, msg, meta)
	if err != nil {
		return "", err
	}

	s, err := marshaller.MarshalToString(res)
	if err != nil {
		return "", errors.Wrap(err, "failed to marshal GRPC response message")
	}

	return s, nil
}

func (d *Domain) GetExampleJSON(files []interface{}, method string) (string, error) {
	protofiles := []*FileModel{}
	if err := mapstructure.Decode(files, &protofiles); err != nil {
		return "", errors.Wrap(err, "invalid argument")
	}

	mdesc, err := findMethod(protofiles, method)
	if err != nil {
		return "", err
	}

	msg := initialize(dynamic.NewMessage(mdesc.GetInputType()))
	result, err := marshaller.MarshalToString(msg)
	if err != nil {
		return "", nil
	}

	return result, nil
}

func (d *Domain) GetFileWithMethod(files []interface{}, method string) (*FileModel, error) {
	protofiles := []*FileModel{}
	if err := mapstructure.Decode(files, &protofiles); err != nil {
		return nil, errors.Wrap(err, "invalid argument")
	}

	mdesc, err := findMethod(protofiles, method)
	if err != nil {
		return nil, err
	}

	for _, f := range protofiles {
		if f.Name == mdesc.GetFile().GetName() {
			return f, nil
		}
	}

	return nil, fmt.Errorf("couldn't find source file for method: %s", method)
}

func findMethod(protofiles []*FileModel, method string) (*desc.MethodDescriptor, error) {
	methods, err := listMethods(protofiles)
	if err != nil {
		return nil, err
	}

	for _, m := range methods {
		if m.GetFullyQualifiedName() == method {
			return m, nil
		}
	}

	return nil, fmt.Errorf("unknown method: %s", method)
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
	Name    string `json:"name"`
	Content string `json:"content"`
}

func initialize(msg *dynamic.Message) *dynamic.Message {
	for _, field := range msg.GetKnownFields() {
		switch field.GetType() {
		case descriptorpb.FieldDescriptorProto_TYPE_MESSAGE:
			nested := initialize(dynamic.NewMessage(field.GetMessageType()))
			msg.SetFieldByName(field.GetName(), nested)
		}
	}
	return msg
}
