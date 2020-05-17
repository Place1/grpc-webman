package grpcweb

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/binary"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"strconv"
	"strings"

	"github.com/golang/protobuf/proto"
	"github.com/jhump/protoreflect/desc"
	"github.com/jhump/protoreflect/dynamic"
	"github.com/pkg/errors"
	"grpc.go4.org/codes"
)

type Client struct {
	server     string
	HttpClient *http.Client
}

func NewClient(server string) *Client {
	return &Client{
		server:     server,
		HttpClient: http.DefaultClient,
	}
}

func (c *Client) InvokeRPC(ctx context.Context, method *desc.MethodDescriptor, msg proto.Message) (proto.Message, error) {
	buf := &bytes.Buffer{}

	b, err := proto.Marshal(msg)
	if err != nil {
		return nil, errors.Wrap(err, "failed to marshal proto message")
	}

	// idk why but the first byte must be 0
	binary.Write(buf, binary.BigEndian, uint8(0))

	// then the next 4 bytes must be a uint32 representing
	// the length of the request message (big endian)
	binary.Write(buf, binary.BigEndian, uint32(len(b)))

	// then the rest of the body is the binary proto message
	buf.Write(b)

	// then we base64 encode the whole thing because we're
	// using application/grpc-web-text (text means base64)
	body := base64.StdEncoding.EncodeToString(buf.Bytes())
	// body := "AAAAAAcKBUphbWVz"
	// fmt.Println(body)

	url := fmt.Sprintf("%s/%s.%s/%s", c.server, method.GetService().GetFile().GetPackage(), method.GetService().GetName(), method.GetName())

	req, err := http.NewRequest("POST", url, strings.NewReader(body))
	if err != nil {
		return nil, errors.Wrap(err, "request format error")
	}

	req.Header.Set("X-User-Agent", "grpc-web-javcascript/0.1")
	req.Header.Set("accept", "application/grpc-web-text")
	req.Header.Set("content-type", "application/grpc-web-text")
	req.Header.Set("TE", "Trailers")

	res, err := c.HttpClient.Do(req)
	if err != nil {
		return nil, errors.Wrap(err, "grpc or network error")
	}
	defer res.Body.Close()

	log.Println(res.StatusCode)

	if status, ok := res.Header["Grpc-Status"]; ok {
		x, _ := strconv.Atoi(status[0])
		fmt.Printf("status = %s\n", codes.Code(uint32(x)).String())
	}

	if message, ok := res.Header["Grpc-Message"]; ok {
		fmt.Printf("message = %s\n", message[0])
	}

	rbin, err := ioutil.ReadAll(res.Body)
	if err != nil {
		return nil, errors.Wrap(err, "failed to read response body")
	}

	resmsg := dynamic.NewMessage(method.GetOutputType())
	if err := UnmarshalGRPCWebText(rbin, resmsg); err != nil {
		return nil, errors.Wrap(err, "failed to unmarshal grpc web response message")
	}

	return resmsg, nil
}
