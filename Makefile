all:
	npm i

clean:
	rm -rf node_modules

shm:
	$(MAKE) all -i -C ./test/data

test: shm
	npm test

.PHONY: test clean shm
