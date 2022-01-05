install: 
	docker run --rm -it -v ${PWD}:/usr/src/app -w /usr/src/app node:14 npm install

dev:
	docker run --rm -it -p 8080:8080 -v ${PWD}:/usr/src/app -w /usr/src/app --name node node:14 npm run start

build:
	docker run --rm -it -v ${PWD}:/usr/src/app -w /usr/src/app node:14 npm run build
