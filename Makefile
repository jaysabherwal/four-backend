all: | prepare copy install_node_modules zip_game zip_disconnect zip_nodemodules clean

prepare:
	rm -rf artifacts
	rm -rf build
	mkdir -p artifacts build

copy:
	cp package.json ./build
	cp package-lock.json ./build
	cp tsconfig.json ./build
	cp -R ./lambda-fns ./build

install_node_modules:
	cd build && \
	npm install --production && \
	npm run build

zip_game:
	cd ./build/lambda-fns && \
	zip -r ../../artifacts/game.zip ./game

zip_disconnect:
	cd ./build/lambda-fns && \
	zip -r ../../artifacts/disconnect.zip ./disconnect

zip_nodemodules:
	cd build && \
	zip -r ../artifacts/nodemodules.zip ./node_modules

clean:
	cd build && \
	rm -rf node_modules