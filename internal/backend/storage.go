package backend

import (
	"log"
	"os"
	"path/filepath"

	badger "github.com/dgraph-io/badger/v2"
	"github.com/pkg/errors"
)

type Storage struct {
	db *badger.DB
}

func NewStorage() *Storage {
	dir, err := os.UserConfigDir()
	if err != nil {
		dir = os.TempDir()
	}

	dir = filepath.Join(dir, "GRPCWebman", "badgerdb")
	if _, err := os.Stat(dir); os.IsNotExist(err) {
		os.MkdirAll(dir, 0700)
	}

	db, err := badger.Open(badger.DefaultOptions(dir).WithInMemory(false))
	if err != nil {
		log.Fatal(err)
	}

	return &Storage{
		db: db,
	}
}

func (s *Storage) SetItem(key string, value string) error {
	// s.data[key] = value
	return s.db.Update(func(txn *badger.Txn) error {
		return txn.Set([]byte(key), []byte(value))
	})
}

func (s *Storage) GetItem(key string) (string, error) {
	// return s.data[key], nil
	result := ""
	err := s.db.View(func(txn *badger.Txn) error {
		item, err := txn.Get([]byte(key))
		if err != nil {
			if err == badger.ErrKeyNotFound {
				return nil
			}
			return errors.Wrap(err, "failed to get item from kv store")
		}
		return item.Value(func(val []byte) error {
			result = string(val)
			return nil
		})
	})
	return result, err
}

func (s *Storage) Clear() error {
	return s.db.DropAll()
}

func (s *Storage) Close() error {
	return s.db.Close()
}
