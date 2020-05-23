package grpcweb

import (
	"bytes"
	"encoding/base64"
	"encoding/binary"
	"io/ioutil"

	"github.com/golang/protobuf/proto"
	"github.com/pkg/errors"
)

func UnmarshalGRPCWebText(b []byte, m proto.Message) error {
	decoded, err := ioutil.ReadAll(base64.NewDecoder(base64.StdEncoding, bytes.NewReader(b)))
	if err != nil {
		return errors.Wrapf(err, "failed to decode base64 grpcweb text: %s", string(b))
	}
	return UnmarshalGRPCWeb(decoded, m)
}

func UnmarshalGRPCWeb(b []byte, m proto.Message) error {
	if len(b) < 5 {
		return errors.New("binary message too short (header)")
	}
	headerBytes := b[1:5]
	msgSize := binary.BigEndian.Uint32(headerBytes)

	if uint32(len(b)) < 5+msgSize {
		return errors.New("binary message too short (data)")
	}
	msgBytes := b[5 : 5+msgSize]
	return proto.Unmarshal(msgBytes, m)
}

func frameRequest(msg proto.Message) ([]byte, error) {
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

	return buf.Bytes(), nil
}
