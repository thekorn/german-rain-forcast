IMAGE_NAME := sample-project
CONTAINER_NAME := sample-project
PORT := 3000

.PHONY: build start stop clean

build:
	docker build -t $(IMAGE_NAME) .

start: build
	docker run -d --name $(CONTAINER_NAME) \
		-p $(PORT):3000 \
		--env-file .env \
		$(IMAGE_NAME)
	@echo "Running at http://localhost:$(PORT)"

stop:
	docker stop $(CONTAINER_NAME) && docker rm $(CONTAINER_NAME)

clean: stop
	docker rmi $(IMAGE_NAME)
