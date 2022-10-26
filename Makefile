dev:
	npm run start

push:
	npm run build
	git add docs
	git commit -m 'build'
	git push origin

pushgb:
	npm run build
	sed -i 's/unc-project-open-aac/gbishop/g' docs/README.md
	git add docs
	git commit -m 'build'
	git push origin

test:
	npm run build
	rsync -a docs gb.cs.unc.edu:/home/gb/public_html/tmp/
