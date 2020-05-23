package grpcweb

import (
	"bytes"
	"context"
	"encoding/base64"
	"fmt"
	"io/ioutil"
	"net/http"

	"github.com/golang/protobuf/proto"
	"github.com/jhump/protoreflect/desc"
	"github.com/jhump/protoreflect/dynamic"
	"github.com/pkg/errors"
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

// i want to support both binary and text
// but i'm struggling to decode grpc-web-text
// responses because the returned body
// isn't valid base64
var usewebtext = false

func (c *Client) InvokeRPC(ctx context.Context, method *desc.MethodDescriptor, msg proto.Message, metadata map[string]string) (proto.Message, error) {
	// then we base64 encode the whole thing because we're
	// using application/grpc-web-text (text means base64)
	body, err := frameRequest(msg)
	if err != nil {
		return nil, err
	}

	if usewebtext {
		body = []byte(base64.StdEncoding.EncodeToString(body))
	}

	url := fmt.Sprintf("%s/%s.%s/%s", c.server, method.GetService().GetFile().GetPackage(), method.GetService().GetName(), method.GetName())
	req, err := http.NewRequest("POST", url, bytes.NewReader(body))
	if err != nil {
		return nil, errors.Wrap(err, "request format error")
	}

	fmt.Printf("\n\nTRACE %v\n\n\n", metadata)

	if metadata != nil {
		for k, v := range metadata {
			if k != "" {
				req.Header.Set(k, v)
			}
		}
	}

	if usewebtext {
		req.Header.Set("accept", "application/grpc-web-text")
		req.Header.Set("content-type", "application/grpc-web-text")
	} else {
		req.Header.Set("accept", "application/grpc-web")
		req.Header.Set("content-type", "application/grpc-web")
	}
	req.Header.Set("X-User-Agent", "grpc-web-javcascript/0.1")
	req.Header.Set("TE", "Trailers")

	res, err := c.HttpClient.Do(req)
	if err != nil {
		return nil, errors.Wrap(err, "grpc or network error")
	}
	defer res.Body.Close()

	if err := checkGrpcError(res); err != nil {
		return nil, err
	}

	rbin, err := ioutil.ReadAll(res.Body)
	if err != nil {
		return nil, errors.Wrap(err, "failed to read response body")
	}

	resmsg := dynamic.NewMessage(method.GetOutputType())

	if res.Header.Get("Content-Type") == "application/grpc-web-text" {
		if err := UnmarshalGRPCWebText(rbin, resmsg); err != nil {
			return nil, errors.Wrap(err, "failed to unmarshal grpc web response message")
		}
	} else {
		if err := UnmarshalGRPCWeb(rbin, resmsg); err != nil {
			return nil, errors.Wrap(err, "failed to unmarshal grpc web response message")
		}
	}

	return resmsg, nil
}
