package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/gorilla/handlers"

	grpc_middleware "github.com/grpc-ecosystem/go-grpc-middleware"
	grpc_recovery "github.com/grpc-ecosystem/go-grpc-middleware/recovery"
	"github.com/improbable-eng/grpc-web/go/grpcweb"
	"github.com/place1/grpc-webman/example-server/proto"
	"google.golang.org/grpc"
)

func main() {
	s := &http.Server{
		Addr:    fmt.Sprintf(":%d", 8000),
		Handler: handlers.LoggingHandler(os.Stdout, createHandler()),
	}

	log.Printf("Listening on %s", s.Addr)
	if err := s.ListenAndServe(); err != http.ErrServerClosed {
		log.Fatalf("Error ListenAndServe: %v", err)
	}
}

// one-time setup to create our GRPC-Web server
func createHandler() http.Handler {
	// GRPC server/middleware
	grpcserver := grpc.NewServer([]grpc.ServerOption{
		grpc.MaxRecvMsgSize(31457280), // 30MB
		grpc.UnaryInterceptor(grpc_middleware.ChainUnaryServer(
			grpc_recovery.UnaryServerInterceptor(),
		)),
	}...)

	// Register our service implementations
	proto.RegisterGreeterServer(grpcserver, &GreeterService{})

	// GRPC-Web server/middleware
	return grpcweb.WrapServer(grpcserver,
		grpcweb.WithAllowNonRootResource(true),
		grpcweb.WithOriginFunc(func(origin string) bool { return true }),
	)
}

type GreeterService struct {
}

func (s *GreeterService) SayHello(ctx context.Context, req *proto.HelloRequest) (*proto.HelloReply, error) {
	return &proto.HelloReply{
		Message: fmt.Sprintf("Hello %s", req.Name),
	}, nil
}
