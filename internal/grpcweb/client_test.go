package grpcweb

import (
	"context"
	"testing"

	"github.com/jhump/protoreflect/desc/protoparse"
	"github.com/jhump/protoreflect/dynamic"
	"github.com/stretchr/testify/require"
)

func TestInvokeRPC(t *testing.T) {
	require := require.New(t)

	parser := &protoparse.Parser{}
	fdescs, err := parser.ParseFiles("../../example-server/example.proto")
	require.NoError(err)

	sdesc := fdescs[0].FindService("proto.Greeter")
	require.NotNil(sdesc)
	mdesc := sdesc.FindMethodByName("SayHello")
	require.NotNil(mdesc)

	msg := dynamic.NewMessage(mdesc.GetInputType())
	msg.SetFieldByName("name", "James")

	client := NewClient("http://localhost:8000")
	res, err := client.InvokeRPC(context.Background(), mdesc, msg)
	require.NoError(err)
	require.NotNil(res)
}
