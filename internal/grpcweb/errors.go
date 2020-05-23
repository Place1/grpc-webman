package grpcweb

import (
	"net/http"
	"strconv"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func checkGrpcError(res *http.Response) error {
	if s, ok := res.Header["Grpc-Status"]; ok {
		x, _ := strconv.Atoi(s[0])
		c := codes.Code(uint32(x))

		msg := ""
		if message, ok := res.Header["Grpc-Message"]; ok {
			msg = message[0]
		}

		if c != codes.OK {
			return status.Error(c, msg)
		}
	}

	return nil
}

// if message, ok := res.Header["Grpc-Message"]; ok && len(message) >= 1 {
// 	return nil, errors.New(message[0])
// }
