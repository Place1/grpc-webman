package grpcweb

import (
	"bytes"
	"encoding/base64"
	"encoding/binary"
	"io/ioutil"

	"github.com/golang/protobuf/proto"
)

func UnmarshalGRPCWebText(b []byte, m proto.Message) error {
	b, err := ioutil.ReadAll(base64.NewDecoder(base64.StdEncoding, bytes.NewReader(b)))
	if err != nil {
		return err
	}
	return UnmarshalGRPCWeb(b, m)
}

func UnmarshalGRPCWeb(b []byte, m proto.Message) error {
	headerBytes := b[1:5]
	msgSize := binary.BigEndian.Uint32(headerBytes)
	msgBytes := b[5 : 5+msgSize]
	return proto.Unmarshal(msgBytes, m)
}
